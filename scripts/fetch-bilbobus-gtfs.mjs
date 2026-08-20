// Builds the Bilbobus route/stop/schedule dataset from the official static GTFS feed.
// Produces one small per-route file (lazy-loaded in the UI) instead of one giant
// blob, since stop_times.txt alone is ~17MB of raw CSV.
//
// This feed leans heavily on calendar_dates.txt (per-date exceptions) rather than
// calendar.txt's weekly pattern - Bilbao overrides the normal schedule for things
// like Aste Nagusia almost every day in August. So instead of a generic
// "weekday/Saturday/Sunday" bucket, schedules are resolved per concrete calendar
// date for a rolling window starting today. That means this script is meant to
// run on a schedule (e.g. nightly via CI) so the window stays current - a stale
// checkout will show a shrinking, eventually past-dated week.
//
// Usage: node scripts/fetch-bilbobus-gtfs.mjs

import { writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import AdmZip from "adm-zip";
import { parseCsv } from "./lib/csv.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "src", "data", "bilbobus");
const GTFS_URL = "https://www.bilbao.eus/opendata/datos/bilbobus-gtfs";
const DAYS_AHEAD = 7;
const WEEKDAY_FIELDS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const WEEKDAY_LABELS_ES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function pad2(n) {
  return String(n).padStart(2, "0");
}

function ymd(date) {
  return `${date.getFullYear()}${pad2(date.getMonth() + 1)}${pad2(date.getDate())}`;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function readEntry(zip, name) {
  const entry = zip.getEntry(name);
  if (!entry) throw new Error(`GTFS zip is missing ${name}`);
  return entry.getData().toString("utf8");
}

/** Resolves which service_ids run on a given date: weekly calendar.txt pattern, then calendar_dates.txt overrides. */
function activeServiceIds(dateObj, calendarRows, exceptionsByDate) {
  const dateStr = ymd(dateObj);
  const weekdayField = WEEKDAY_FIELDS[dateObj.getDay()];
  const active = new Set();
  for (const row of calendarRows) {
    if (dateStr >= row.start_date && dateStr <= row.end_date && row[weekdayField] === "1") {
      active.add(row.service_id);
    }
  }
  for (const ex of exceptionsByDate.get(dateStr) ?? []) {
    if (ex.exception_type === "1") active.add(ex.service_id);
    else if (ex.exception_type === "2") active.delete(ex.service_id);
  }
  return active;
}

async function main() {
  console.log(`Fetching ${GTFS_URL} ...`);
  const res = await fetch(GTFS_URL);
  if (!res.ok) throw new Error(`GTFS download failed: ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  const zip = new AdmZip(buffer);

  const stopsRows = parseCsv(readEntry(zip, "stops.txt"));
  const routesRows = parseCsv(readEntry(zip, "routes.txt"));
  const tripsRows = parseCsv(readEntry(zip, "trips.txt"));
  const calendarRows = parseCsv(readEntry(zip, "calendar.txt"));
  const calendarDatesRows = parseCsv(readEntry(zip, "calendar_dates.txt"));
  const stopTimesRows = parseCsv(readEntry(zip, "stop_times.txt"));
  console.log(
    `Parsed ${stopsRows.length} stops, ${routesRows.length} routes, ${tripsRows.length} trips, ${stopTimesRows.length} stop_times rows`
  );

  const exceptionsByDate = new Map();
  for (const ex of calendarDatesRows) {
    let arr = exceptionsByDate.get(ex.date);
    if (!arr) {
      arr = [];
      exceptionsByDate.set(ex.date, arr);
    }
    arr.push(ex);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const window = Array.from({ length: DAYS_AHEAD }, (_, i) => addDays(today, i));

  // serviceId -> list of dateStr this service is active on, within our window
  const datesByServiceId = new Map();
  const dateMeta = [];
  for (const date of window) {
    const dateStr = ymd(date);
    dateMeta.push({ date: dateStr, weekday: WEEKDAY_LABELS_ES[date.getDay()] });
    for (const serviceId of activeServiceIds(date, calendarRows, exceptionsByDate)) {
      let arr = datesByServiceId.get(serviceId);
      if (!arr) {
        arr = [];
        datesByServiceId.set(serviceId, arr);
      }
      arr.push(dateStr);
    }
  }
  console.log(`Resolved schedule window ${dateMeta[0].date} .. ${dateMeta.at(-1).date}`);

  const stopsById = new Map(
    stopsRows.map((r) => [r.stop_id, { code: r.stop_code, name: r.stop_name, lat: Number(r.stop_lat), lon: Number(r.stop_lon) }])
  );
  const routesById = new Map(
    routesRows.map((r) => [
      r.route_id,
      { shortName: r.route_short_name, longName: r.route_long_name, color: r.route_color || null },
    ])
  );
  const tripsById = new Map(
    tripsRows.map((r) => [r.trip_id, { routeId: r.route_id, directionId: r.direction_id, serviceId: r.service_id }])
  );

  const stopTimesByTrip = new Map();
  for (const row of stopTimesRows) {
    let arr = stopTimesByTrip.get(row.trip_id);
    if (!arr) {
      arr = [];
      stopTimesByTrip.set(row.trip_id, arr);
    }
    arr.push(row);
  }

  /** key = `${routeId}|${directionId}` */
  const stopOrderBuilt = new Set();
  const routeDirStopOrder = new Map(); // key -> stopId[]
  const routeDirTimes = new Map(); // key -> Map(stopId -> { [dateStr]: string[] })

  for (const [tripId, rows] of stopTimesByTrip) {
    const trip = tripsById.get(tripId);
    if (!trip) continue;
    const activeDates = datesByServiceId.get(trip.serviceId);
    if (!activeDates || activeDates.length === 0) continue;

    const sorted = [...rows].sort((a, b) => Number(a.stop_sequence) - Number(b.stop_sequence));
    const key = `${trip.routeId}|${trip.directionId}`;

    if (!stopOrderBuilt.has(key)) {
      routeDirStopOrder.set(key, sorted.map((r) => r.stop_id));
      stopOrderBuilt.add(key);
    }

    let timesByStop = routeDirTimes.get(key);
    if (!timesByStop) {
      timesByStop = new Map();
      routeDirTimes.set(key, timesByStop);
    }
    for (const r of sorted) {
      let byDate = timesByStop.get(r.stop_id);
      if (!byDate) {
        byDate = {};
        timesByStop.set(r.stop_id, byDate);
      }
      for (const dateStr of activeDates) {
        (byDate[dateStr] ??= []).push(r.departure_time);
      }
    }
  }

  await mkdir(path.join(OUT_DIR, "routes"), { recursive: true });

  const routeList = [];
  const routeIds = new Set([...routeDirStopOrder.keys()].map((k) => k.split("|")[0]));

  for (const routeId of routeIds) {
    const meta = routesById.get(routeId);
    if (!meta) continue;

    const directions = {};
    for (const directionId of ["0", "1"]) {
      const key = `${routeId}|${directionId}`;
      const stopOrder = routeDirStopOrder.get(key);
      if (!stopOrder) continue;
      const timesByStop = routeDirTimes.get(key);

      directions[directionId] = stopOrder.map((stopId) => {
        const stop = stopsById.get(stopId);
        const times = timesByStop.get(stopId) ?? {};
        for (const dateStr of Object.keys(times)) {
          times[dateStr] = [...new Set(times[dateStr])].sort();
        }
        return { code: stop?.code ?? stopId, name: stop?.name ?? "?", lat: stop?.lat, lon: stop?.lon, times };
      });
    }

    if (Object.keys(directions).length === 0) continue;

    routeList.push({ id: meta.shortName, longName: meta.longName, color: meta.color });
    await writeFile(
      path.join(OUT_DIR, "routes", `${meta.shortName}.json`),
      JSON.stringify({ id: meta.shortName, longName: meta.longName, dates: dateMeta, directions })
    );
  }

  routeList.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
  await writeFile(path.join(OUT_DIR, "routes.json"), JSON.stringify(routeList));

  // GTFS-RT vehicle positions reference route_id (GTFS internal id, e.g. "51"),
  // not route_short_name (e.g. "01") - the realtime layer needs this to label vehicles.
  const routeIdToShortName = Object.fromEntries([...routesById.entries()].map(([id, r]) => [id, r.shortName]));
  await writeFile(path.join(OUT_DIR, "routeIdToShortName.json"), JSON.stringify(routeIdToShortName));

  console.log(`Wrote ${routeList.length} route files to ${path.join(OUT_DIR, "routes")}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

<script lang="ts">
  import { getRouteList, getRouteDetail } from "../lib/bilbobus/routes";
  import { getVehiclePositions, filterByRoute } from "../lib/bilbobus/realtime";
  import type { BilbobusRouteSummary, BilbobusRouteDetail, BilbobusVehicle } from "../lib/bilbobus/types";
  import { OPERATOR_LABEL } from "../lib/shared/operators";
  import Spinner from "./shared/Spinner.svelte";

  let routes = $state<BilbobusRouteSummary[]>([]);
  let routesLoading = $state(true);

  let selectedRouteId = $state("");
  let routeDetail = $state<BilbobusRouteDetail | null>(null);
  let routeLoading = $state(false);

  let direction = $state<"0" | "1">("0");
  let dateIndex = $state(0);
  let expandedStopCode = $state<string | null>(null);

  let vehicles = $state<BilbobusVehicle[]>([]);
  let vehiclesLoading = $state(false);
  let vehiclesError = $state<string | null>(null);

  getRouteList().then((list) => {
    routes = list;
    routesLoading = false;
  });

  async function selectRoute(routeId: string) {
    selectedRouteId = routeId;
    direction = "0";
    dateIndex = 0;
    expandedStopCode = null;
    routeLoading = true;
    routeDetail = await getRouteDetail(routeId);
    if (!routeDetail.directions[direction]) {
      direction = (Object.keys(routeDetail.directions)[0] as "0" | "1") ?? "0";
    }
    routeLoading = false;
    refreshVehicles();
  }

  async function refreshVehicles() {
    if (!selectedRouteId) return;
    vehiclesLoading = true;
    vehiclesError = null;
    try {
      const all = await getVehiclePositions();
      vehicles = filterByRoute(all, selectedRouteId);
    } catch (e) {
      vehiclesError = e instanceof Error ? e.message : "Error desconocido";
    } finally {
      vehiclesLoading = false;
    }
  }

  function currentHms(): string {
    return new Date().toTimeString().slice(0, 8);
  }

  function upcomingTimes(times: string[], dateStr: string, limit = 3): string[] {
    const isToday = dateStr === todayStr();
    const from = isToday ? currentHms() : "00:00:00";
    const upcoming = times.filter((t) => t >= from);
    return (upcoming.length > 0 ? upcoming : times).slice(0, limit);
  }

  function todayStr(): string {
    const d = new Date();
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  }

  function toggleStop(code: string) {
    expandedStopCode = expandedStopCode === code ? null : code;
  }
</script>

<section class="block">
  <h2>🚍 {OPERATOR_LABEL.bilbobus}</h2>

  {#if routesLoading}
    <p class="status"><Spinner /> Cargando líneas...</p>
  {:else}
    <select bind:value={selectedRouteId} onchange={() => selectRoute(selectedRouteId)}>
      <option value="" disabled>Elige una línea...</option>
      {#each routes as route (route.id)}
        <option value={route.id}>{route.id} · {route.longName}</option>
      {/each}
    </select>
  {/if}

  {#if routeLoading}
    <p class="status"><Spinner /> Cargando recorrido...</p>
  {:else if routeDetail}
    <div class="route">
      <div class="direction-tabs">
        {#each Object.keys(routeDetail.directions) as dir (dir)}
          <button type="button" class:active={direction === dir} onclick={() => (direction = dir as "0" | "1")}>
            {dir === "0" ? "Ida" : "Vuelta"}
          </button>
        {/each}
      </div>

      <div class="date-tabs">
        {#each routeDetail.dates as d, i (d.date)}
          <button type="button" class:active={dateIndex === i} onclick={() => (dateIndex = i)}>
            {d.weekday} {d.date.slice(6, 8)}/{d.date.slice(4, 6)}
          </button>
        {/each}
      </div>

      <div class="vehicles">
        {#if vehiclesLoading}
          <span class="status"><Spinner /> Buscando autobuses activos...</span>
        {:else if vehiclesError}
          <span class="status error">Sin datos en vivo: {vehiclesError}</span>
        {:else if vehicles.length > 0}
          <span class="status live">🟢 {vehicles.length} autobús(es) circulando ahora en esta línea</span>
        {:else}
          <span class="status">Sin autobuses circulando ahora mismo en esta línea.</span>
        {/if}
        <button type="button" onclick={refreshVehicles}>↻</button>
      </div>

      <ol class="stops">
        {#each routeDetail.directions[direction] ?? [] as stop (stop.code)}
          {@const dateStr = routeDetail.dates[dateIndex].date}
          {@const times = stop.times[dateStr] ?? []}
          <li>
            <button type="button" class="stop-row" onclick={() => toggleStop(stop.code)}>
              <span class="stop-name">{stop.name}</span>
              <span class="next-times">
                {#if times.length === 0}
                  sin servicio
                {:else}
                  {upcomingTimes(times, dateStr).map((t) => t.slice(0, 5)).join(" · ")}
                {/if}
              </span>
            </button>
            {#if expandedStopCode === stop.code}
              <div class="all-times">
                {#if times.length === 0}
                  <p class="status">Sin horarios este día.</p>
                {:else}
                  {#each times as t (t)}
                    <span class="time-chip">{t.slice(0, 5)}</span>
                  {/each}
                {/if}
              </div>
            {/if}
          </li>
        {/each}
      </ol>
    </div>
  {/if}
</section>

<style>
  .block {
    max-width: 480px;
    margin: 0 auto 2rem;
    font-family: system-ui, sans-serif;
  }
  select {
    width: 100%;
    padding: 0.6rem 0.8rem;
    font-size: 1rem;
    border: 1px solid #ccc;
    border-radius: 8px;
    box-sizing: border-box;
  }
  .route {
    margin-top: 1rem;
  }
  .direction-tabs,
  .date-tabs {
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
    margin-bottom: 0.5rem;
  }
  .direction-tabs button,
  .date-tabs button {
    border: 1px solid #ddd;
    background: white;
    border-radius: 999px;
    padding: 0.3rem 0.7rem;
    font-size: 0.85rem;
    cursor: pointer;
  }
  .direction-tabs button.active,
  .date-tabs button.active {
    background: #f39200;
    color: white;
    border-color: #f39200;
  }
  .vehicles {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0.5rem 0;
    font-size: 0.85rem;
  }
  .vehicles button {
    border: 1px solid #ddd;
    background: white;
    border-radius: 6px;
    cursor: pointer;
    padding: 0.1rem 0.5rem;
  }
  .status.live {
    color: #1a7f37;
  }
  .status.error {
    color: #c0392b;
  }
  .stops {
    list-style: none;
    padding: 0;
    margin: 0.5rem 0;
    border-top: 1px solid #eee;
  }
  .stops li {
    border-bottom: 1px solid #eee;
  }
  .stop-row {
    width: 100%;
    background: none;
    border: none;
    padding: 0.5rem 0;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    gap: 0.5rem;
    text-align: left;
    font-size: 0.9rem;
  }
  .next-times {
    color: #444;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
  .all-times {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
    padding: 0 0 0.6rem;
  }
  .time-chip {
    background: #fff2e0;
    border-radius: 4px;
    padding: 0.1rem 0.4rem;
    font-size: 0.8rem;
    font-variant-numeric: tabular-nums;
  }
  .status {
    color: #666;
  }
</style>

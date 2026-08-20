<script lang="ts">
  import { getRouteList, getRouteDetail } from "../lib/bilbobus/routes";
  import { getVehiclePositions, filterByRoute } from "../lib/bilbobus/realtime";
  import type { BilbobusRouteSummary, BilbobusRouteDetail, BilbobusVehicle } from "../lib/bilbobus/types";
  import Spinner from "./shared/Spinner.svelte";
  import { RefreshCw, ChevronDown } from "@lucide/svelte";

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

  function todayStr(): string {
    const d = new Date();
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  }

  function upcomingTimes(times: string[], dateStr: string, limit = 3): string[] {
    const isToday = dateStr === todayStr();
    const from = isToday ? currentHms() : "00:00:00";
    const upcoming = times.filter((t) => t >= from);
    return (upcoming.length > 0 ? upcoming : times).slice(0, limit);
  }

  function toggleStop(code: string) {
    expandedStopCode = expandedStopCode === code ? null : code;
  }
</script>

<section class="space-y-3">
  {#if routesLoading}
    <p class="flex items-center gap-2 py-2 text-sm text-text-muted"><Spinner /> Cargando líneas...</p>
  {:else}
    <div class="relative">
      <select
        bind:value={selectedRouteId}
        onchange={() => selectRoute(selectedRouteId)}
        class="w-full appearance-none rounded-2xl border border-border bg-surface px-4 py-3 pr-10 text-sm text-text focus:outline-none focus:ring-2 focus:ring-bilbobus/50"
      >
        <option value="" disabled>Elige una línea...</option>
        {#each routes as route (route.id)}
          <option value={route.id}>{route.id} · {route.longName}</option>
        {/each}
      </select>
      <ChevronDown size={16} class="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-text-faint" />
    </div>
  {/if}

  {#if routeLoading}
    <p class="flex items-center gap-2 py-2 text-sm text-text-muted"><Spinner /> Cargando recorrido...</p>
  {:else if routeDetail}
    <div class="rounded-2xl border border-border bg-surface p-4">
      <div class="mb-2 flex flex-wrap gap-1">
        {#each Object.keys(routeDetail.directions) as dir (dir)}
          <button
            type="button"
            class="rounded-full px-3 py-1 text-xs font-medium transition-colors"
            class:bg-bilbobus={direction === dir}
            class:text-black={direction === dir}
            class:bg-surface-hover={direction !== dir}
            class:text-text-muted={direction !== dir}
            onclick={() => (direction = dir as "0" | "1")}
          >
            {dir === "0" ? "Ida" : "Vuelta"}
          </button>
        {/each}
      </div>

      <div class="mb-3 flex flex-wrap gap-1">
        {#each routeDetail.dates as d, i (d.date)}
          <button
            type="button"
            class="rounded-full px-2.5 py-1 text-xs font-medium transition-colors"
            class:bg-bilbobus={dateIndex === i}
            class:text-black={dateIndex === i}
            class:bg-surface-hover={dateIndex !== i}
            class:text-text-muted={dateIndex !== i}
            onclick={() => (dateIndex = i)}
          >
            {d.weekday} {d.date.slice(6, 8)}/{d.date.slice(4, 6)}
          </button>
        {/each}
      </div>

      <div class="mb-3 flex items-center gap-2 text-xs">
        {#if vehiclesLoading}
          <span class="flex items-center gap-1.5 text-text-muted"><Spinner size={13} /> Buscando autobuses activos...</span>
        {:else if vehiclesError}
          <span class="text-red-400">Sin datos en vivo: {vehiclesError}</span>
        {:else if vehicles.length > 0}
          <span class="flex items-center gap-1.5 text-bizkaibus">
            <span class="h-1.5 w-1.5 rounded-full bg-bizkaibus"></span>
            {vehicles.length} autobús(es) circulando ahora
          </span>
        {:else}
          <span class="text-text-faint">Sin autobuses circulando ahora mismo.</span>
        {/if}
        <button
          type="button"
          class="ml-auto rounded-full p-1 text-text-faint hover:bg-surface-hover hover:text-text"
          onclick={refreshVehicles}
          aria-label="Actualizar"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      <ol class="divide-y divide-border border-t border-border">
        {#each routeDetail.directions[direction] ?? [] as stop (stop.code)}
          {@const dateStr = routeDetail.dates[dateIndex].date}
          {@const times = stop.times[dateStr] ?? []}
          <li>
            <button
              type="button"
              class="flex w-full items-center justify-between gap-2 py-2.5 text-left"
              onclick={() => toggleStop(stop.code)}
            >
              <span class="truncate text-sm">{stop.name}</span>
              <span class="shrink-0 text-xs tabular-nums text-text-muted">
                {#if times.length === 0}
                  sin servicio
                {:else}
                  {upcomingTimes(times, dateStr).map((t) => t.slice(0, 5)).join(" · ")}
                {/if}
              </span>
            </button>
            {#if expandedStopCode === stop.code}
              <div class="flex flex-wrap gap-1.5 pb-3">
                {#if times.length === 0}
                  <p class="text-xs text-text-faint">Sin horarios este día.</p>
                {:else}
                  {#each times as t (t)}
                    <span class="rounded-md bg-bilbobus/10 px-1.5 py-0.5 text-xs tabular-nums text-bilbobus">
                      {t.slice(0, 5)}
                    </span>
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

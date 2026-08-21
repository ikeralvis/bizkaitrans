<script lang="ts">
  import { getRouteList, getRouteDetail } from "../lib/bilbobus/routes";
  import { getVehiclePositions, filterByRoute } from "../lib/bilbobus/realtime";
  import type { BilbobusRouteSummary, BilbobusRouteDetail, BilbobusVehicle } from "../lib/bilbobus/types";
  import { favorites } from "../lib/shared/favorites.svelte";
  import Spinner from "./shared/Spinner.svelte";
  import FavoriteButton from "./shared/FavoriteButton.svelte";
  import OperatorBanner from "./shared/OperatorBanner.svelte";
  import { RefreshCw, ChevronLeft, ChevronDown, Star, Search, X, Bus } from "@lucide/svelte";

  let routes = $state<BilbobusRouteSummary[]>([]);
  let routesLoading = $state(true);
  let routeQuery = $state("");

  let selectedRouteId = $state("");
  let routeDetail = $state<BilbobusRouteDetail | null>(null);
  let routeLoading = $state(false);

  let direction = $state<"0" | "1">("0");
  let dateIndex = $state(0);
  let expandedStopCode = $state<string | null>(null);
  let viewMode = $state<"next" | "schedule">("next");
  let scheduleStopCode = $state<string | null>(null);

  let vehicles = $state<BilbobusVehicle[]>([]);
  let vehiclesLoading = $state(false);
  let vehiclesError = $state<string | null>(null);

  getRouteList().then((list) => {
    routes = list;
    routesLoading = false;
  });

  let bilbobusFavoriteIds = $derived(
    new Set(favorites.items.filter((f) => f.operator === "bilbobus").map((f) => f.code))
  );

  let visibleRoutes = $derived(
    routeQuery.trim().length === 0
      ? routes
      : routes.filter(
          (r) =>
            r.id.toLowerCase().includes(routeQuery.trim().toLowerCase()) ||
            r.longName.toLowerCase().includes(routeQuery.trim().toLowerCase())
        )
  );

  function backToRoutes() {
    selectedRouteId = "";
    routeDetail = null;
  }

  async function selectRoute(routeId: string) {
    selectedRouteId = routeId;
    direction = "0";
    expandedStopCode = null;
    routeLoading = true;
    routeDetail = await getRouteDetail(routeId);
    if (!routeDetail.directions[direction]) {
      direction = (Object.keys(routeDetail.directions)[0] as "0" | "1") ?? "0";
    }
    if (routeDetail.dates.length === 1 && routeDetail.dates[0].date === "APPROX") {
      // Pipeline fell back to an approximate schedule (see fetch-bilbobus-gtfs.mjs) -
      // there's only one "day" to pick.
      dateIndex = 0;
    } else {
      // The dataset covers a rolling window generated at build time - if the
      // page has been open across a day boundary (or data hasn't been
      // refreshed), index 0 is no longer "today". Find the real match instead
      // of assuming, falling back to the closest future date.
      const today = todayStr();
      const exactIdx = routeDetail.dates.findIndex((d) => d.date === today);
      dateIndex = exactIdx >= 0 ? exactIdx : Math.max(0, routeDetail.dates.findIndex((d) => d.date > today));
    }
    viewMode = "next";
    scheduleStopCode = routeDetail.directions[direction]?.[0]?.code ?? null;
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
    // In approximate-schedule mode there's no real "today" to compare against,
    // but showing what's next from now is still more useful than always
    // showing the start of the day.
    const isToday = dateStr === todayStr() || dateStr === "APPROX";
    const from = isToday ? currentHms() : "00:00:00";
    const upcoming = times.filter((t) => t >= from);
    return (upcoming.length > 0 ? upcoming : times).slice(0, limit);
  }

  function toggleStop(code: string) {
    expandedStopCode = expandedStopCode === code ? null : code;
  }
</script>

<OperatorBanner color="var(--color-bilbobus)" title="Bilbobus" icon={Bus} />

<section class="space-y-3">
  {#if !selectedRouteId}
    <div class="relative">
      <Search size={16} class="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-text-faint" />
      <input
        type="text"
        placeholder="Buscar línea (ej. 01, Plaza Circular...)"
        class="w-full rounded-2xl border border-border bg-surface py-3 pr-10 pl-10 text-sm text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-bilbobus/50"
        bind:value={routeQuery}
      />
      {#if routeQuery}
        <button
          type="button"
          class="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1 text-text-faint hover:bg-surface-hover hover:text-text"
          onclick={() => (routeQuery = "")}
          aria-label="Limpiar búsqueda"
        >
          <X size={15} />
        </button>
      {/if}
    </div>

    {#if routesLoading}
      <p class="flex items-center gap-2 py-2 text-sm text-text-muted"><Spinner /> Cargando líneas...</p>
    {:else}
      <div class="grid grid-cols-2 gap-2.5">
        {#each visibleRoutes as route (route.id)}
          <div
            role="button"
            tabindex="0"
            class="group relative flex flex-col gap-2 rounded-2xl border border-border bg-surface p-3.5 text-left transition-colors hover:bg-surface-hover active:scale-[0.98]"
            onclick={() => selectRoute(route.id)}
            onkeydown={(e) => e.key === "Enter" && selectRoute(route.id)}
          >
            <div class="flex items-start justify-between gap-1">
              <span
                class="flex h-9 min-w-9 items-center justify-center rounded-xl px-2 text-sm font-bold text-white"
                style:background={route.color ? `#${route.color}` : "var(--color-bilbobus)"}
              >
                {route.id}
              </span>
              <button
                type="button"
                class="rounded-full p-1 text-text-faint hover:bg-surface-hover"
                class:text-amber-400={bilbobusFavoriteIds.has(route.id)}
                onclick={(e) => {
                  e.stopPropagation();
                  favorites.toggle({ operator: "bilbobus", code: route.id, name: `${route.id} · ${route.longName}` });
                }}
                aria-label="Favorito"
              >
                <Star size={14} fill={bilbobusFavoriteIds.has(route.id) ? "currentColor" : "none"} />
              </button>
            </div>
            <span class="line-clamp-2 text-xs leading-snug font-semibold text-text">{route.longName}</span>
          </div>
        {/each}
      </div>
      {#if visibleRoutes.length === 0}
        <p class="py-6 text-center text-sm text-text-faint">Sin líneas que coincidan con "{routeQuery}".</p>
      {/if}
    {/if}
  {:else}
    <button type="button" class="flex items-center gap-1 text-sm text-text-muted hover:text-text" onclick={backToRoutes}>
      <ChevronLeft size={16} /> Volver a líneas
    </button>
  {/if}

  {#if routeLoading}
    <p class="flex items-center gap-2 py-2 text-sm text-text-muted"><Spinner /> Cargando recorrido...</p>
  {:else if routeDetail}
    <div class="rounded-2xl border border-border bg-surface p-4">
      <div class="mb-3 flex items-center gap-2">
        <span
          class="flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-bold text-white"
          style:background={routes.find((r) => r.id === selectedRouteId)?.color
            ? `#${routes.find((r) => r.id === selectedRouteId)?.color}`
            : "var(--color-bilbobus)"}
        >
          {selectedRouteId}
        </span>
        <span class="text-sm font-medium">{routeDetail.longName}</span>
        <FavoriteButton
          stop={{ operator: "bilbobus", code: selectedRouteId, name: `${selectedRouteId} · ${routeDetail.longName}` }}
        />
      </div>
      <div class="mb-2 flex flex-wrap gap-1">
        {#each Object.keys(routeDetail.directions) as dir (dir)}
          <button
            type="button"
            class="rounded-full px-3 py-1 text-xs font-medium transition-colors"
            class:bg-bilbobus={direction === dir}
            class:text-black={direction === dir}
            class:bg-surface-hover={direction !== dir}
            class:text-text-muted={direction !== dir}
            onclick={() => {
              direction = dir as '0' | '1';
              scheduleStopCode = routeDetail?.directions[direction]?.[0]?.code ?? null;
            }}
          >
            {dir === "0" ? "Ida" : "Vuelta"}
          </button>
        {/each}
      </div>

      <div class="mb-3 flex gap-1 rounded-2xl bg-surface p-1 ring-1 ring-border">
        <button
          type="button"
          class="flex-1 rounded-xl py-2 text-xs font-semibold transition-colors"
          class:bg-bilbobus={viewMode === "next"}
          class:text-black={viewMode === "next"}
          class:text-text-faint={viewMode !== "next"}
          onclick={() => (viewMode = "next")}
        >
          Próximos
        </button>
        <button
          type="button"
          class="flex-1 rounded-xl py-2 text-xs font-semibold transition-colors"
          class:bg-bilbobus={viewMode === "schedule"}
          class:text-black={viewMode === "schedule"}
          class:text-text-faint={viewMode !== "schedule"}
          onclick={() => (viewMode = "schedule")}
        >
          Horario completo
        </button>
      </div>

      {#if routeDetail.dates.length === 1 && routeDetail.dates[0].date === "APPROX"}
        <p class="mb-3 rounded-xl bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
          Horario aproximado: la fuente de datos de Bilbobus no tiene esta semana bien sincronizado su calendario de
          servicio, así que no podemos garantizar que sea el de hoy exacto.
        </p>
      {:else}
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
      {/if}

      <div class="mb-3 flex items-center gap-2 text-xs">
        {#if vehiclesLoading}
          <span class="flex items-center gap-1.5 text-text-muted"><Spinner size={13} /> Buscando autobuses activos...</span>
        {:else if vehiclesError}
          <span class="text-red-400">Sin datos en vivo: {vehiclesError}</span>
        {:else if vehicles.length > 0}
          <span class="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-1 font-semibold text-emerald-400">
            <span class="h-1.5 w-1.5 animate-live-pulse rounded-full bg-emerald-400"></span>
            {vehicles.length} en tiempo real ahora
          </span>
        {:else}
          <span class="rounded-full bg-surface-hover px-2 py-1 font-medium text-text-faint">Horario estimado (sin GPS activo)</span>
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

      {#if viewMode === "next"}
        <ul class="space-y-2.5">
          {#each routeDetail.directions[direction] ?? [] as stop, i (stop.code)}
            {@const dateStr = routeDetail.dates[dateIndex].date}
            {@const times = stop.times[dateStr] ?? []}
            {@const next = upcomingTimes(times, dateStr, 1)[0]}
            <li class="overflow-hidden rounded-2xl border border-border bg-surface">
              <button
                type="button"
                class="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-surface-hover"
                onclick={() => toggleStop(stop.code)}
              >
                <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-bilbobus/10 text-xs font-semibold text-bilbobus">
                  {i + 1}
                </span>
                <span class="min-w-0 flex-1 truncate text-base font-medium">{stop.name}</span>
                <span class="shrink-0 text-xl font-bold tabular-nums">
                  {#if times.length === 0}
                    <span class="text-sm font-normal text-text-faint">sin servicio</span>
                  {:else}
                    {next?.slice(0, 5)}
                  {/if}
                </span>
              </button>
              {#if expandedStopCode === stop.code}
                <div class="flex flex-wrap gap-1.5 border-t border-border px-4 py-3">
                  {#if times.length === 0}
                    <p class="text-xs text-text-faint">Sin horarios este día.</p>
                  {:else}
                    {#each times as t (t)}
                      <span class="rounded-lg bg-bilbobus/10 px-2 py-1 text-sm font-medium tabular-nums text-bilbobus">
                        {t.slice(0, 5)}
                      </span>
                    {/each}
                  {/if}
                </div>
              {/if}
            </li>
          {/each}
        </ul>
      {:else}
        {@const dateStr = routeDetail.dates[dateIndex].date}
        {@const stopList = routeDetail.directions[direction] ?? []}
        {@const activeStop = stopList.find((s) => s.code === scheduleStopCode) ?? stopList[0]}
        <div class="space-y-3">
          <div class="relative">
            <select
              bind:value={scheduleStopCode}
              class="w-full appearance-none rounded-2xl border border-border bg-surface px-4 py-3 pr-10 text-sm font-medium text-text focus:outline-none focus:ring-2 focus:ring-bilbobus/50"
            >
              {#each stopList as stop (stop.code)}
                <option value={stop.code}>{stop.name}</option>
              {/each}
            </select>
            <ChevronDown size={16} class="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-text-faint" />
          </div>

          {#if activeStop}
            {@const allTimes = activeStop.times[dateStr] ?? []}
            {#if allTimes.length === 0}
              <p class="rounded-2xl border border-border bg-surface p-6 text-center text-sm text-text-faint">
                Sin horarios este día para esta parada.
              </p>
            {:else}
              <div class="grid grid-cols-4 gap-2">
                {#each allTimes as t (t)}
                  <span class="rounded-xl bg-bilbobus/10 py-2 text-center text-sm font-semibold tabular-nums text-bilbobus">
                    {t.slice(0, 5)}
                  </span>
                {/each}
              </div>
            {/if}
          {/if}
        </div>
      {/if}
    </div>
  {/if}
</section>

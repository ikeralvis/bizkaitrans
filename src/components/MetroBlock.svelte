<script lang="ts">
  import { getStation, getRealTimeTrip } from "../lib/metro/api";
  import { toPlatformGroups } from "../lib/metro/normalize";
  import type { MetroStation, MetroTrip } from "../lib/metro/types";
  import stations from "../data/metro/stations.json";
  import lineOrder from "../data/metro/line-order.json";
  import { favorites } from "../lib/shared/favorites.svelte";
  import ArrivalsList from "./shared/ArrivalsList.svelte";
  import SearchDropdown from "./shared/SearchDropdown.svelte";
  import Spinner from "./shared/Spinner.svelte";
  import FavoriteButton from "./shared/FavoriteButton.svelte";
  import BottomSheet from "./shared/BottomSheet.svelte";
  import OperatorBanner from "./shared/OperatorBanner.svelte";
  import MetroFares from "./metro/MetroFares.svelte";
  import MetroAlerts from "./metro/MetroAlerts.svelte";
  import {
    RefreshCw,
    Accessibility,
    ArrowUpFromLine,
    CreditCard,
    Star,
    Bell,
    X,
    ArrowRightLeft,
    TramFront,
    Leaf,
    ChevronLeft,
    ChevronRight,
  } from "@lucide/svelte";

  let showFares = $state(false);
  let showAlerts = $state(false);

  interface StationEntry {
    id: number;
    name: string;
    code: string;
    lines: string[];
  }

  interface LineStation {
    code: string;
    name: string;
  }

  const allStations = stations as StationEntry[];
  const orderedLines = lineOrder as Record<string, LineStation[]>;
  const allLines = Object.keys(orderedLines);
  let metroFavorites = $derived(favorites.items.filter((f) => f.operator === "metro"));

  // --- Origin/destination real-time trip search ---
  let originQuery = $state("");
  let destQuery = $state("");
  let origin = $state<StationEntry | null>(null);
  let destination = $state<StationEntry | null>(null);
  let trip = $state<MetroTrip | null>(null);
  let tripLoading = $state(false);
  let tripError = $state<string | null>(null);

  let originSuggestions = $derived(
    origin || originQuery.trim().length === 0
      ? []
      : allStations.filter((s) => s.name.toLowerCase().includes(originQuery.trim().toLowerCase())).slice(0, 6)
  );
  let destSuggestions = $derived(
    destination || destQuery.trim().length === 0
      ? []
      : allStations.filter((s) => s.name.toLowerCase().includes(destQuery.trim().toLowerCase())).slice(0, 6)
  );

  function selectOrigin(s: StationEntry) {
    origin = s;
    originQuery = s.name;
    maybeSearchTrip();
  }
  function selectDestination(s: StationEntry) {
    destination = s;
    destQuery = s.name;
    maybeSearchTrip();
  }
  function clearOrigin() {
    origin = null;
    originQuery = "";
    trip = null;
  }
  function clearDestination() {
    destination = null;
    destQuery = "";
    trip = null;
  }
  function swap() {
    const o = origin;
    const oq = originQuery;
    origin = destination;
    originQuery = destQuery;
    destination = o;
    destQuery = oq;
    maybeSearchTrip();
  }

  async function maybeSearchTrip() {
    if (!origin || !destination) return;
    tripLoading = true;
    tripError = null;
    trip = null;
    try {
      trip = await getRealTimeTrip(origin.code, destination.code);
    } catch (e) {
      tripError = e instanceof Error ? e.message : "Error desconocido";
    } finally {
      tripLoading = false;
    }
  }

  // --- Line browser (real physical order) + single-station detail ---
  let activeLine = $state<string>(allLines[0] ?? "L1");
  let selected = $state<{ code: string; name: string } | null>(null);
  let station = $state<MetroStation | null>(null);
  let platformGroups = $state<ReturnType<typeof toPlatformGroups>>([]);
  let loading = $state(false);
  let error = $state<string | null>(null);

  let lineStations = $derived(orderedLines[activeLine] ?? []);

  async function selectStation(entry: { code: string; name: string }) {
    selected = entry;
    loading = true;
    error = null;
    try {
      station = await getStation(entry.code);
      platformGroups = toPlatformGroups(station);
    } catch (e) {
      error = e instanceof Error ? e.message : "Error desconocido";
    } finally {
      loading = false;
    }
  }

  function backToLines() {
    selected = null;
    station = null;
  }

  function refresh() {
    if (selected) selectStation(selected);
  }
</script>

<OperatorBanner
  color="var(--color-metro)"
  title="Metro Bilbao"
  logo="https://www.metrobilbao.eus/img/mb-logo-white-text.png"
  illustration="https://www.metrobilbao.eus/img/tren-vector.svg"
  illustrationVariant="brand"
>
  {#snippet actions()}
    <button
      type="button"
      class="rounded-full p-2 text-white/90 hover:bg-white/15"
      onclick={() => (showFares = true)}
      aria-label="Ver tarifas"
    >
      <CreditCard size={19} />
    </button>
    <button
      type="button"
      class="relative rounded-full p-2 text-white/90 hover:bg-white/15"
      onclick={() => (showAlerts = true)}
      aria-label="Ver avisos"
    >
      <Bell size={19} />
    </button>
  {/snippet}
</OperatorBanner>

<section class="space-y-2">
  <div class="flex items-center gap-2">
    <div class="flex-1 space-y-2">
      <div class="relative">
        <input
          type="text"
          placeholder="Origen"
          class="w-full rounded-2xl border border-border bg-surface px-4 py-3 pr-10 text-sm text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-metro/50"
          bind:value={originQuery}
          oninput={() => (origin = null)}
        />
        {#if originQuery}
          <button
            type="button"
            class="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1 text-text-faint hover:bg-surface-hover hover:text-text"
            onclick={clearOrigin}
            aria-label="Limpiar origen"
          >
            <X size={15} />
          </button>
        {/if}
        <SearchDropdown items={originSuggestions} getKey={(s) => s.id} onSelect={selectOrigin}>
          {#snippet item(s: StationEntry)}
            <span class="truncate">{s.name}</span>
            <span class="shrink-0 text-xs text-text-faint">{s.lines.join(" / ")}</span>
          {/snippet}
        </SearchDropdown>
      </div>
      <div class="relative">
        <input
          type="text"
          placeholder="Destino"
          class="w-full rounded-2xl border border-border bg-surface px-4 py-3 pr-10 text-sm text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-metro/50"
          bind:value={destQuery}
          oninput={() => (destination = null)}
        />
        {#if destQuery}
          <button
            type="button"
            class="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1 text-text-faint hover:bg-surface-hover hover:text-text"
            onclick={clearDestination}
            aria-label="Limpiar destino"
          >
            <X size={15} />
          </button>
        {/if}
        <SearchDropdown items={destSuggestions} getKey={(s) => s.id} onSelect={selectDestination}>
          {#snippet item(s: StationEntry)}
            <span class="truncate">{s.name}</span>
            <span class="shrink-0 text-xs text-text-faint">{s.lines.join(" / ")}</span>
          {/snippet}
        </SearchDropdown>
      </div>
    </div>
    <button
      type="button"
      class="shrink-0 rounded-full border border-border bg-surface p-2.5 text-text-muted hover:bg-surface-hover disabled:opacity-40"
      onclick={swap}
      disabled={!origin && !destination}
      aria-label="Intercambiar origen y destino"
    >
      <ArrowRightLeft size={16} />
    </button>
  </div>

  {#if !selected && metroFavorites.length > 0}
    <div class="flex flex-wrap gap-1.5">
      {#each metroFavorites as fav (fav.code)}
        <button
          type="button"
          class="flex items-center gap-1 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-text-muted hover:bg-surface-hover"
          onclick={() => selectStation({ code: fav.code, name: fav.name })}
        >
          <Star size={11} class="text-amber-400" fill="currentColor" />
          {fav.name}
        </button>
      {/each}
    </div>
  {/if}
</section>

{#if tripLoading}
  <p class="mt-3 flex items-center gap-2 py-2 text-sm text-text-muted"><Spinner /> Calculando ruta...</p>
{:else if tripError}
  <p class="mt-3 py-2 text-sm text-red-400">Error: {tripError}</p>
{:else if trip}
  <div class="mt-3 space-y-3 rounded-2xl border border-border bg-surface p-4">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm text-text-muted">{trip.trip.fromStation.name} → {trip.trip.toStation.name}</p>
        <p class="flex items-center gap-2 text-lg font-semibold">
          <span class="rounded-full bg-metro px-2 py-0.5 text-xs font-bold text-white">{trip.trip.line}</span>
          {trip.trip.duration} min
          {#if trip.trip.transfer}
            <span class="text-xs font-normal text-text-faint">(con transbordo)</span>
          {/if}
        </p>
      </div>
      <button
        type="button"
        class="rounded-full p-1.5 text-text-faint hover:bg-surface-hover hover:text-text"
        onclick={maybeSearchTrip}
        aria-label="Actualizar"
      >
        <RefreshCw size={16} />
      </button>
    </div>

    <div>
      <p class="mb-1.5 text-xs font-medium text-text-faint uppercase">Próximos trenes</p>
      {#if trip.trains.length === 0}
        <p class="text-sm text-text-faint">Sin trenes próximos.</p>
      {:else}
        <ul class="divide-y divide-border">
          {#each trip.trains as train, i (i)}
            <li class="flex items-center gap-3 py-3">
              <span class="min-w-0 flex-1">
                <span class="block truncate text-base font-medium text-text">→ {train.direction}</span>
                <span class="mt-0.5 flex items-center gap-1 text-xs text-text-faint">
                  <TramFront size={13} class="shrink-0" />
                  {train.wagons} vagones
                </span>
              </span>
              <span class="shrink-0 text-2xl font-bold tabular-nums">
                {train.estimated <= 0 ? "Ahora" : `${train.estimated}′`}
              </span>
            </li>
          {/each}
        </ul>
      {/if}
    </div>

    {#if trip.co2Metro}
      <div class="flex items-start gap-2 rounded-xl bg-bizkaibus/10 p-3 text-xs text-bizkaibus">
        <Leaf size={14} class="mt-0.5 shrink-0" />
        <span>
          Este trayecto en metro emite ~{trip.co2Metro.co2metro} kg de CO₂, frente a ~{trip.co2Metro.co2Car} kg en coche
          (ahorro de {trip.co2Metro.diff} kg).
        </span>
      </div>
    {/if}

    {#if trip.messages && trip.messages.length > 0}
      <div class="space-y-1">
        {#each trip.messages as msg, i (i)}
          <p class="text-xs text-amber-400">{msg}</p>
        {/each}
      </div>
    {/if}
  </div>
{:else if !selected}
  <!-- No trip search in progress: browse stations by line -->
  <div class="mt-4 mb-2 flex gap-1 rounded-2xl bg-surface p-1 ring-1 ring-border">
    {#each allLines as line (line)}
      <button
        type="button"
        class="flex-1 rounded-xl py-2 text-sm font-semibold transition-colors"
        class:bg-metro={activeLine === line}
        class:text-white={activeLine === line}
        class:text-text-faint={activeLine !== line}
        onclick={() => (activeLine = line)}
      >
        Línea {line.replace("L", "")}
      </button>
    {/each}
  </div>
  <ul class="space-y-2">
    {#each lineStations as s (s.code)}
      <li>
        <button
          type="button"
          class="flex w-full items-center justify-between gap-2 rounded-2xl border border-border bg-surface px-4 py-3.5 text-left transition-colors hover:bg-surface-hover active:scale-[0.99]"
          onclick={() => selectStation(s)}
        >
          <span class="text-sm font-medium">{s.name}</span>
          <ChevronRight size={16} class="shrink-0 text-text-faint" />
        </button>
      </li>
    {/each}
  </ul>
{/if}

{#if selected}
  <div class="mt-3 space-y-3">
    <button type="button" class="flex items-center gap-1 text-sm text-text-muted hover:text-text" onclick={backToLines}>
      <ChevronLeft size={16} /> Volver a la línea
    </button>

    {#if loading}
      <p class="flex items-center gap-2 py-2 text-sm text-text-muted"><Spinner /> Cargando tiempos...</p>
    {:else if error}
      <p class="py-2 text-sm text-red-400">Error: {error}</p>
    {:else if station}
      <div class="overflow-hidden rounded-2xl border border-border bg-surface">
        {#if station.img}
          <img src={station.img} alt={station.name} class="h-32 w-full object-cover" loading="lazy" />
        {/if}
        <div class="p-4">
          <div class="mb-2 flex items-center justify-between">
            <h3 class="font-semibold">{station.name}</h3>
            <div class="flex items-center gap-1">
              <FavoriteButton stop={{ operator: "metro", code: station.code, name: station.name, meta: station.line.join(" / ") }} />
              <button
                type="button"
                class="rounded-full p-1.5 text-text-faint hover:bg-surface-hover hover:text-text"
                onclick={refresh}
                aria-label="Actualizar"
              >
                <RefreshCw size={16} />
              </button>
            </div>
          </div>

          {#each platformGroups as group, i (i)}
            {#if group.length > 0}
              <p class="mt-3 mb-1 text-xs font-medium text-text-faint uppercase">
                Andén {i + 1} · dirección {group[0].headsign}
              </p>
              <ArrivalsList arrivals={group} emptyMessage="Sin trenes próximos." live={false} />
            {/if}
          {/each}

          {#if station.exits.length > 0}
            <div class="mt-3 border-t border-border pt-3">
              <p class="mb-1.5 text-xs font-medium text-text-faint uppercase">Accesos</p>
              <ul class="space-y-1">
                {#each station.exits as exit (exit.id)}
                  <li class="flex items-center gap-2 text-xs text-text-muted">
                    <ArrowUpFromLine size={13} class="shrink-0" />
                    <span class="truncate">{exit.name} · {exit.address}</span>
                    {#if exit.wheelchairAccessible}
                      <Accessibility size={13} class="ml-auto shrink-0 text-bizkaibus" />
                    {/if}
                  </li>
                {/each}
              </ul>
            </div>
          {/if}
        </div>
      </div>
    {/if}
  </div>
{/if}

{#if showFares}
  <BottomSheet title="Tarifas Metro Bilbao" onClose={() => (showFares = false)}>
    <MetroFares />
  </BottomSheet>
{/if}

{#if showAlerts}
  <BottomSheet title="Avisos e incidencias" onClose={() => (showAlerts = false)}>
    <MetroAlerts />
  </BottomSheet>
{/if}

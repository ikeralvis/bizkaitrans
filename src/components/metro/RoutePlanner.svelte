<script lang="ts">
  import { getRealTimeTrip } from "../../lib/metro/api";
  import type { MetroTrip } from "../../lib/metro/types";
  import stations from "../../data/metro/stations.json";
  import SearchDropdown from "../shared/SearchDropdown.svelte";
  import Spinner from "../shared/Spinner.svelte";
  import { ArrowRightLeft, TrainFront, Leaf, RefreshCw } from "@lucide/svelte";

  interface StationEntry {
    id: number;
    name: string;
    code: string;
    lines: string[];
  }
  const allStations = stations as StationEntry[];

  let originQuery = $state("");
  let destQuery = $state("");
  let origin = $state<StationEntry | null>(null);
  let destination = $state<StationEntry | null>(null);

  let trip = $state<MetroTrip | null>(null);
  let loading = $state(false);
  let error = $state<string | null>(null);

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
    maybeSearch();
  }
  function selectDestination(s: StationEntry) {
    destination = s;
    destQuery = s.name;
    maybeSearch();
  }

  function swap() {
    const o = origin;
    const oq = originQuery;
    origin = destination;
    originQuery = destQuery;
    destination = o;
    destQuery = oq;
    maybeSearch();
  }

  async function maybeSearch() {
    if (!origin || !destination) return;
    loading = true;
    error = null;
    trip = null;
    try {
      trip = await getRealTimeTrip(origin.code, destination.code);
    } catch (e) {
      error = e instanceof Error ? e.message : "Error desconocido";
    } finally {
      loading = false;
    }
  }

  function refresh() {
    maybeSearch();
  }
</script>

<section class="space-y-3">
  <div class="flex items-center gap-2">
    <div class="flex-1 space-y-2">
      <div class="relative">
        <input
          type="text"
          placeholder="Origen"
          class="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-metro/50"
          bind:value={originQuery}
          oninput={() => (origin = null)}
        />
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
          class="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-metro/50"
          bind:value={destQuery}
          oninput={() => (destination = null)}
        />
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

  {#if loading}
    <p class="flex items-center gap-2 py-2 text-sm text-text-muted"><Spinner /> Calculando ruta...</p>
  {:else if error}
    <p class="py-2 text-sm text-red-400">Error: {error}</p>
  {:else if trip}
    <div class="space-y-3 rounded-2xl border border-border bg-surface p-4">
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
          onclick={refresh}
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
              <li class="flex items-center gap-3 py-2">
                <TrainFront size={16} class="shrink-0 text-metro" />
                <span class="flex-1 text-sm text-text-muted">
                  → {train.direction} · {train.wagons} vagones
                </span>
                <span class="shrink-0 text-sm font-semibold tabular-nums">
                  {train.estimated <= 0 ? "Ahora" : `${train.estimated} min`}
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
  {/if}
</section>

<script lang="ts">
  import { getStation } from "../lib/metro/api";
  import { toArrivalEstimates } from "../lib/metro/normalize";
  import type { MetroStation } from "../lib/metro/types";
  import type { ArrivalEstimate } from "../lib/shared/types";
  import stations from "../data/metro/stations.json";
  import ArrivalsList from "./shared/ArrivalsList.svelte";
  import SearchDropdown from "./shared/SearchDropdown.svelte";
  import Spinner from "./shared/Spinner.svelte";
  import { RefreshCw, Accessibility, ArrowUpFromLine } from "@lucide/svelte";

  interface StationEntry {
    id: number;
    name: string;
    code: string;
    lines: string[];
  }

  const allStations = stations as StationEntry[];

  let query = $state("");
  let selected = $state<StationEntry | null>(null);
  let station = $state<MetroStation | null>(null);
  let arrivals = $state<ArrivalEstimate[]>([]);
  let loading = $state(false);
  let error = $state<string | null>(null);

  let filtered = $derived(
    selected || query.trim().length === 0
      ? []
      : allStations.filter((s) => s.name.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 8)
  );

  async function selectStation(entry: StationEntry) {
    selected = entry;
    query = entry.name;
    loading = true;
    error = null;
    try {
      station = await getStation(entry.code);
      arrivals = toArrivalEstimates(station).sort((a, b) => a.minutesLeft - b.minutesLeft);
    } catch (e) {
      error = e instanceof Error ? e.message : "Error desconocido";
    } finally {
      loading = false;
    }
  }

  function refresh() {
    if (selected) selectStation(selected);
  }
</script>

<section class="space-y-3">
  <div class="relative">
    <input
      type="text"
      placeholder="Buscar estación (ej. Abando, San Mamés...)"
      class="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-metro/50"
      bind:value={query}
      oninput={() => (selected = null)}
    />
    <SearchDropdown items={filtered} getKey={(s) => s.id} onSelect={selectStation}>
      {#snippet item(s: StationEntry)}
        <span class="truncate">{s.name}</span>
        <span class="shrink-0 text-xs text-text-faint">{s.lines.join(" / ")}</span>
      {/snippet}
    </SearchDropdown>
  </div>

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
          <button
            type="button"
            class="rounded-full p-1.5 text-text-faint hover:bg-surface-hover hover:text-text"
            onclick={refresh}
            aria-label="Actualizar"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        <ArrivalsList {arrivals} emptyMessage="Sin trenes próximos." />

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
</section>

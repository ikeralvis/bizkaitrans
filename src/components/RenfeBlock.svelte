<script lang="ts">
  import { getBilbaoArrivals, filterByStop } from "../lib/renfe/api";
  import { toArrivalEstimates } from "../lib/renfe/normalize";
  import type { ArrivalEstimate } from "../lib/shared/types";
  import stations from "../data/renfe/stations.json";
  import ArrivalsList from "./shared/ArrivalsList.svelte";
  import SearchDropdown from "./shared/SearchDropdown.svelte";
  import Spinner from "./shared/Spinner.svelte";
  import FavoriteButton from "./shared/FavoriteButton.svelte";
  import { RefreshCw } from "@lucide/svelte";

  interface RenfeStation {
    code: string;
    name: string;
    municipality: string;
    lat: number;
    lon: number;
  }

  const allStations = stations as RenfeStation[];

  let query = $state("");
  let selected = $state<RenfeStation | null>(null);
  let arrivals = $state<ArrivalEstimate[]>([]);
  let loading = $state(false);
  let error = $state<string | null>(null);

  let filtered = $derived(
    selected || query.trim().length === 0
      ? []
      : allStations.filter((s) => s.name.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 8)
  );

  async function selectStation(entry: RenfeStation) {
    selected = entry;
    query = entry.name;
    loading = true;
    error = null;
    try {
      const all = await getBilbaoArrivals();
      const updates = filterByStop(all, entry.code);
      arrivals = toArrivalEstimates(updates)
        .filter((a) => a.minutesLeft >= -1)
        .sort((a, b) => a.minutesLeft - b.minutesLeft);
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
      placeholder="Buscar estación (ej. Abando, Deusto...)"
      class="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-renfe/50"
      bind:value={query}
      oninput={() => (selected = null)}
    />
    <SearchDropdown items={filtered} getKey={(s) => s.code} onSelect={selectStation}>
      {#snippet item(s: RenfeStation)}
        <span class="truncate">{s.name}</span>
        <span class="shrink-0 text-xs text-text-faint">{s.municipality}</span>
      {/snippet}
    </SearchDropdown>
  </div>

  {#if loading}
    <p class="flex items-center gap-2 py-2 text-sm text-text-muted"><Spinner /> Cargando tiempos...</p>
  {:else if error}
    <p class="py-2 text-sm text-red-400">Error: {error}</p>
  {:else if selected}
    <div class="rounded-2xl border border-border bg-surface p-4">
      <div class="mb-2 flex items-center justify-between">
        <h3 class="font-semibold">{selected.name}</h3>
        <div class="flex items-center gap-1">
          <FavoriteButton stop={{ operator: "renfe", code: selected.code, name: selected.name, meta: selected.municipality }} />
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
      <ArrivalsList {arrivals} emptyMessage="Sin trenes próximos." />
    </div>
  {/if}
</section>

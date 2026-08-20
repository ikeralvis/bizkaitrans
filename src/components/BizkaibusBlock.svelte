<script lang="ts">
  import { getStopArrivalsRaw } from "../lib/bizkaibus/api";
  import { parsePasoParadaXml, toArrivalEstimates } from "../lib/bizkaibus/normalize";
  import { searchBizkaibusStops } from "../lib/bizkaibus/search";
  import type { BizkaibusStop } from "../lib/bizkaibus/types";
  import type { ArrivalEstimate } from "../lib/shared/types";
  import { debounce } from "../lib/shared/debounce";
  import ArrivalsList from "./shared/ArrivalsList.svelte";
  import SearchDropdown from "./shared/SearchDropdown.svelte";
  import Spinner from "./shared/Spinner.svelte";
  import { RefreshCw } from "@lucide/svelte";

  let query = $state("");
  let suggestions = $state<BizkaibusStop[]>([]);
  let searching = $state(false);
  let selected = $state<BizkaibusStop | null>(null);
  let arrivals = $state<ArrivalEstimate[]>([]);
  let loading = $state(false);
  let error = $state<string | null>(null);

  const runSearch = debounce(async (q: string) => {
    searching = true;
    suggestions = await searchBizkaibusStops(q, 8);
    searching = false;
  }, 250);

  function onQueryInput() {
    selected = null;
    const q = query.trim();
    if (q.length < 2) {
      suggestions = [];
      return;
    }
    runSearch(q);
  }

  async function selectStop(stop: BizkaibusStop) {
    selected = stop;
    query = stop.name;
    suggestions = [];
    loading = true;
    error = null;
    try {
      const raw = await getStopArrivalsRaw(stop.code);
      const parsed = parsePasoParadaXml(raw.Resultado);
      arrivals = toArrivalEstimates(parsed).sort((a, b) => a.minutesLeft - b.minutesLeft);
    } catch (e) {
      error = e instanceof Error ? e.message : "Error desconocido";
    } finally {
      loading = false;
    }
  }

  function refresh() {
    if (selected) selectStop(selected);
  }
</script>

<section class="space-y-3">
  <div class="relative">
    <input
      type="text"
      placeholder="Buscar parada (ej. Zabalburu, Getxo...)"
      class="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-bizkaibus/50"
      bind:value={query}
      oninput={onQueryInput}
    />
    {#if searching}
      <p class="absolute mt-1 flex w-full items-center gap-2 rounded-2xl border border-border bg-surface px-3 py-2 text-sm text-text-muted">
        <Spinner /> Buscando...
      </p>
    {:else}
      <SearchDropdown items={suggestions} getKey={(s) => s.code} onSelect={selectStop}>
        {#snippet item(s: BizkaibusStop)}
          <span class="truncate">{s.name}</span>
          <span class="shrink-0 text-xs text-text-faint">{s.municipality}</span>
        {/snippet}
      </SearchDropdown>
    {/if}
  </div>

  {#if loading}
    <p class="flex items-center gap-2 py-2 text-sm text-text-muted"><Spinner /> Cargando tiempos...</p>
  {:else if error}
    <p class="py-2 text-sm text-red-400">Error: {error}</p>
  {:else if selected}
    <div class="rounded-2xl border border-border bg-surface p-4">
      <div class="mb-2 flex items-center justify-between">
        <h3 class="font-semibold">{selected.name}</h3>
        <button
          type="button"
          class="rounded-full p-1.5 text-text-faint hover:bg-surface-hover hover:text-text"
          onclick={refresh}
          aria-label="Actualizar"
        >
          <RefreshCw size={16} />
        </button>
      </div>
      <ArrivalsList {arrivals} emptyMessage="Sin autobuses próximos." />
    </div>
  {/if}
</section>

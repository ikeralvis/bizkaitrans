<script lang="ts">
  import { getStopArrivalsRaw } from "../lib/bizkaibus/api";
  import { parsePasoParadaXml, toArrivalEstimates } from "../lib/bizkaibus/normalize";
  import { searchBizkaibusStops } from "../lib/bizkaibus/search";
  import type { BizkaibusStop } from "../lib/bizkaibus/types";
  import type { ArrivalEstimate } from "../lib/shared/types";
  import { OPERATOR_LABEL } from "../lib/shared/operators";
  import { debounce } from "../lib/shared/debounce";
  import ArrivalsList from "./shared/ArrivalsList.svelte";
  import Spinner from "./shared/Spinner.svelte";

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

<section class="block">
  <h2>🚌 {OPERATOR_LABEL.bizkaibus}</h2>

  <div class="search">
    <input
      type="text"
      placeholder="Buscar parada (ej. Zabalburu, Getxo...)"
      bind:value={query}
      oninput={onQueryInput}
    />
    {#if searching}
      <p class="status inline"><Spinner /> Buscando...</p>
    {:else if suggestions.length > 0}
      <ul class="suggestions">
        {#each suggestions as stop (stop.code)}
          <li>
            <button type="button" onclick={() => selectStop(stop)}>
              {stop.name} <span class="meta">{stop.municipality}</span>
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </div>

  {#if loading}
    <p class="status"><Spinner /> Cargando tiempos...</p>
  {:else if error}
    <p class="status error">Error: {error}</p>
  {:else if selected}
    <div class="board">
      <div class="board-header">
        <h3>{selected.name}</h3>
        <button type="button" onclick={refresh}>↻ Actualizar</button>
      </div>
      <ArrivalsList {arrivals} emptyMessage="Sin autobuses próximos." />
    </div>
  {/if}
</section>

<style>
  .block {
    max-width: 480px;
    margin: 0 auto 2rem;
    font-family: system-ui, sans-serif;
  }
  .search {
    position: relative;
  }
  input {
    width: 100%;
    padding: 0.6rem 0.8rem;
    font-size: 1rem;
    border: 1px solid #ccc;
    border-radius: 8px;
    box-sizing: border-box;
  }
  .suggestions {
    position: absolute;
    z-index: 10;
    background: white;
    border: 1px solid #ddd;
    border-radius: 8px;
    width: 100%;
    max-height: 320px;
    overflow-y: auto;
    list-style: none;
    margin: 4px 0 0;
    padding: 0.25rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  .suggestions li button {
    width: 100%;
    text-align: left;
    background: none;
    border: none;
    padding: 0.5rem;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    gap: 0.5rem;
  }
  .suggestions li button:hover {
    background: #f2f2f2;
  }
  .meta {
    color: #888;
    font-size: 0.85rem;
    white-space: nowrap;
  }
  .board {
    margin-top: 1rem;
  }
  .board-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .status {
    color: #666;
  }
  .status.inline {
    position: absolute;
    z-index: 10;
    background: white;
    width: 100%;
    box-sizing: border-box;
    margin: 4px 0 0;
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 8px;
  }
  .status.error {
    color: #c0392b;
  }
</style>

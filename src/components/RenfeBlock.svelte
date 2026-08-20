<script lang="ts">
  import { getBilbaoArrivals, filterByStop } from "../lib/renfe/api";
  import { toArrivalEstimates } from "../lib/renfe/normalize";
  import type { ArrivalEstimate } from "../lib/shared/types";
  import { OPERATOR_LABEL } from "../lib/shared/operators";
  import stations from "../data/renfe/stations.json";
  import ArrivalsList from "./shared/ArrivalsList.svelte";
  import Spinner from "./shared/Spinner.svelte";

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
    query.trim().length === 0
      ? []
      : allStations.filter((s) => s.name.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 8)
  );

  async function selectStation(station: RenfeStation) {
    selected = station;
    query = station.name;
    filtered = [];
    loading = true;
    error = null;
    try {
      const all = await getBilbaoArrivals();
      const updates = filterByStop(all, station.code);
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

<section class="block">
  <h2>🚆 {OPERATOR_LABEL.renfe}</h2>

  <div class="search">
    <input
      type="text"
      placeholder="Buscar estación (ej. Abando, Deusto...)"
      bind:value={query}
      oninput={() => (selected = null)}
    />
    {#if filtered.length > 0}
      <ul class="suggestions">
        {#each filtered as station (station.code)}
          <li>
            <button type="button" onclick={() => selectStation(station)}>
              {station.name} <span class="meta">{station.municipality}</span>
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
      <ArrivalsList {arrivals} emptyMessage="Sin trenes próximos." />
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
  }
  .suggestions li button:hover {
    background: #f2f2f2;
  }
  .meta {
    color: #888;
    font-size: 0.85rem;
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
  .status.error {
    color: #c0392b;
  }
</style>

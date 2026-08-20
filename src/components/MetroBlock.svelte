<script lang="ts">
  import { getStation, toArrivalEstimates } from "../lib/metro/api";
  import type { ArrivalEstimate } from "../lib/shared/types";
  import stations from "../data/metro/stations.json";

  interface StationEntry {
    id: number;
    name: string;
    code: string;
    lines: string[];
  }

  const allStations = stations as StationEntry[];

  let query = $state("");
  let selected = $state<StationEntry | null>(null);
  let arrivals = $state<ArrivalEstimate[]>([]);
  let loading = $state(false);
  let error = $state<string | null>(null);

  let filtered = $derived(
    query.trim().length === 0
      ? []
      : allStations
          .filter((s) => s.name.toLowerCase().includes(query.trim().toLowerCase()))
          .slice(0, 8)
  );

  async function selectStation(station: StationEntry) {
    selected = station;
    query = station.name;
    filtered = [];
    loading = true;
    error = null;
    try {
      const data = await getStation(station.code);
      arrivals = toArrivalEstimates(data).sort((a, b) => a.minutesLeft - b.minutesLeft);
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

<section class="metro-block">
  <h2>🚇 Metro Bilbao</h2>

  <div class="search">
    <input
      type="text"
      placeholder="Buscar estación (ej. Abando, San Mamés...)"
      bind:value={query}
      oninput={() => (selected = null)}
    />
    {#if filtered.length > 0}
      <ul class="suggestions">
        {#each filtered as station (station.id)}
          <li>
            <button type="button" onclick={() => selectStation(station)}>
              {station.name} <span class="lines">{station.lines.join(" / ")}</span>
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </div>

  {#if loading}
    <p class="status">Cargando tiempos...</p>
  {:else if error}
    <p class="status error">Error: {error}</p>
  {:else if selected}
    <div class="board">
      <div class="board-header">
        <h3>{selected.name}</h3>
        <button type="button" onclick={refresh}>↻ Actualizar</button>
      </div>
      {#if arrivals.length === 0}
        <p class="status">Sin trenes próximos.</p>
      {:else}
        <ul class="arrivals">
          {#each arrivals as train}
            <li>
              <span class="line-badge">{train.lineId}</span>
              <span class="headsign">{train.headsign}</span>
              <span class="minutes">
                {train.minutesLeft <= 0 ? "Ahora" : `${train.minutesLeft} min`}
              </span>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  {/if}
</section>

<style>
  .metro-block {
    max-width: 480px;
    margin: 0 auto;
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
  .lines {
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
  .arrivals {
    list-style: none;
    padding: 0;
    margin: 0.5rem 0;
  }
  .arrivals li {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 0;
    border-bottom: 1px solid #eee;
  }
  .line-badge {
    background: #e30613;
    color: white;
    font-weight: bold;
    padding: 0.15rem 0.5rem;
    border-radius: 4px;
    font-size: 0.85rem;
  }
  .headsign {
    flex: 1;
  }
  .minutes {
    font-weight: bold;
  }
  .status {
    color: #666;
  }
  .status.error {
    color: #c0392b;
  }
</style>

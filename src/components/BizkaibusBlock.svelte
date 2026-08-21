<script lang="ts">
  import { getStopArrivalsRaw } from "../lib/bizkaibus/api";
  import { parsePasoParadaXml, toArrivalEstimates } from "../lib/bizkaibus/normalize";
  import { searchBizkaibusStops } from "../lib/bizkaibus/search";
  import type { BizkaibusStop } from "../lib/bizkaibus/types";
  import type { ArrivalEstimate } from "../lib/shared/types";
  import { debounce } from "../lib/shared/debounce";
  import { favorites } from "../lib/shared/favorites.svelte";
  import ArrivalsList from "./shared/ArrivalsList.svelte";
  import SearchDropdown from "./shared/SearchDropdown.svelte";
  import Spinner from "./shared/Spinner.svelte";
  import FavoriteButton from "./shared/FavoriteButton.svelte";
  import LinesBrowser from "./bizkaibus/LinesBrowser.svelte";
  import OperatorBanner from "./shared/OperatorBanner.svelte";
  import { RefreshCw, Star, X, BusFront } from "@lucide/svelte";

  let viewMode = $state<"stops" | "lines">("stops");
  let bizkaibusFavorites = $derived(favorites.items.filter((f) => f.operator === "bizkaibus"));

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

  function onKeydown(e: KeyboardEvent) {
    if (e.key === "Enter" && suggestions.length > 0) {
      e.preventDefault();
      selectStop(suggestions[0]);
    }
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

<OperatorBanner color="var(--color-bizkaibus)" title="Bizkaibus" icon={BusFront} />

<div class="mb-3 flex gap-1 rounded-2xl bg-surface p-1 ring-1 ring-border">
  <button
    type="button"
    class="flex-1 rounded-xl py-2 text-xs font-semibold transition-colors"
    class:bg-bizkaibus={viewMode === "stops"}
    class:text-black={viewMode === "stops"}
    class:text-text-faint={viewMode !== "stops"}
    onclick={() => (viewMode = "stops")}
  >
    Por paradas
  </button>
  <button
    type="button"
    class="flex-1 rounded-xl py-2 text-xs font-semibold transition-colors"
    class:bg-bizkaibus={viewMode === "lines"}
    class:text-black={viewMode === "lines"}
    class:text-text-faint={viewMode !== "lines"}
    onclick={() => (viewMode = "lines")}
  >
    Por líneas
  </button>
</div>

{#if viewMode === "lines"}
  <LinesBrowser />
{:else}
  <section class="space-y-3">
    <div class="relative">
      <input
        type="text"
        placeholder="Buscar parada (ej. Zabalburu, Getxo...)"
        class="w-full rounded-2xl border border-border bg-surface px-4 py-3 pr-10 text-sm text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-bizkaibus/50"
        bind:value={query}
        oninput={onQueryInput}
        onkeydown={onKeydown}
      />
      {#if query && !searching}
        <button
          type="button"
          class="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1 text-text-faint hover:bg-surface-hover hover:text-text"
          onclick={() => {
            query = "";
            selected = null;
            suggestions = [];
          }}
          aria-label="Limpiar búsqueda"
        >
          <X size={15} />
        </button>
      {/if}
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

    {#if !selected && bizkaibusFavorites.length > 0}
      <div class="flex flex-wrap gap-1.5">
        {#each bizkaibusFavorites as fav (fav.code)}
          <button
            type="button"
            class="flex items-center gap-1 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-text-muted hover:bg-surface-hover"
            onclick={() => selectStop({ code: fav.code, name: fav.name, municipality: fav.meta ?? "", lat: 0, lon: 0 })}
          >
            <Star size={11} class="text-amber-400" fill="currentColor" />
            {fav.name}
          </button>
        {/each}
      </div>
    {/if}

    {#if loading}
      <p class="flex items-center gap-2 py-2 text-sm text-text-muted"><Spinner /> Cargando tiempos...</p>
    {:else if error}
      <p class="py-2 text-sm text-red-400">Error: {error}</p>
    {:else if selected}
      <div class="rounded-2xl border border-border bg-surface p-4">
        <div class="mb-2 flex items-center justify-between">
          <h3 class="font-semibold">{selected.name}</h3>
          <div class="flex items-center gap-1">
            <FavoriteButton stop={{ operator: "bizkaibus", code: selected.code, name: selected.name, meta: selected.municipality }} />
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
        <ArrivalsList {arrivals} emptyMessage="Sin autobuses próximos." />

        {#if selected.lines && selected.lines.length > 0}
          <div class="mt-3 border-t border-border pt-3">
            <p class="mb-1.5 text-xs font-medium text-text-faint uppercase">Correspondencias</p>
            <div class="flex flex-wrap gap-1">
              {#each selected.lines as lineCode (lineCode)}
                <span class="rounded-full bg-bizkaibus/10 px-2 py-0.5 text-xs font-medium text-bizkaibus">
                  {lineCode}
                </span>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    {/if}
  </section>
{/if}

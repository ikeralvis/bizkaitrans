<script lang="ts">
  import { getStation } from "../lib/metro/api";
  import { toPlatformGroups } from "../lib/metro/normalize";
  import type { MetroStation } from "../lib/metro/types";
  import stations from "../data/metro/stations.json";
  import { favorites } from "../lib/shared/favorites.svelte";
  import ArrivalsList from "./shared/ArrivalsList.svelte";
  import SearchDropdown from "./shared/SearchDropdown.svelte";
  import Spinner from "./shared/Spinner.svelte";
  import FavoriteButton from "./shared/FavoriteButton.svelte";
  import BottomSheet from "./shared/BottomSheet.svelte";
  import MetroFares from "./metro/MetroFares.svelte";
  import MetroAlerts from "./metro/MetroAlerts.svelte";
  import { RefreshCw, Accessibility, ArrowUpFromLine, CreditCard, Star, Bell, X } from "@lucide/svelte";

  let showFares = $state(false);
  let showAlerts = $state(false);

  interface StationEntry {
    id: number;
    name: string;
    code: string;
    lines: string[];
  }

  const allStations = stations as StationEntry[];
  let metroFavorites = $derived(favorites.items.filter((f) => f.operator === "metro"));

  let query = $state("");
  let selected = $state<StationEntry | null>(null);
  let station = $state<MetroStation | null>(null);
  let platformGroups = $state<ReturnType<typeof toPlatformGroups>>([]);
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
      platformGroups = toPlatformGroups(station);
    } catch (e) {
      error = e instanceof Error ? e.message : "Error desconocido";
    } finally {
      loading = false;
    }
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === "Enter" && filtered.length > 0) {
      e.preventDefault();
      selectStation(filtered[0]);
    }
  }

  function refresh() {
    if (selected) selectStation(selected);
  }
</script>

<div class="flex items-center justify-between">
  <h2 class="text-lg font-bold">Metro Bilbao</h2>
  <button
    type="button"
    class="relative rounded-full p-2 text-text-faint hover:bg-surface-hover hover:text-text"
    onclick={() => (showAlerts = true)}
    aria-label="Ver avisos"
  >
    <Bell size={19} />
  </button>
</div>

<section class="space-y-3">
  <div class="relative">
    <input
      type="text"
      placeholder="Buscar estación (ej. Abando, San Mamés...)"
      class="w-full rounded-2xl border border-border bg-surface px-4 py-3 pr-10 text-sm text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-metro/50"
      bind:value={query}
      oninput={() => (selected = null)}
      onkeydown={onKeydown}
    />
    {#if query}
      <button
        type="button"
        class="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1 text-text-faint hover:bg-surface-hover hover:text-text"
        onclick={() => {
          query = "";
          selected = null;
        }}
        aria-label="Limpiar búsqueda"
      >
        <X size={15} />
      </button>
    {/if}
    <SearchDropdown items={filtered} getKey={(s) => s.id} onSelect={selectStation}>
      {#snippet item(s: StationEntry)}
        <span class="truncate">{s.name}</span>
        <span class="shrink-0 text-xs text-text-faint">{s.lines.join(" / ")}</span>
      {/snippet}
    </SearchDropdown>
  </div>

  {#if !selected && metroFavorites.length > 0}
    <div class="flex flex-wrap gap-1.5">
      {#each metroFavorites as fav (fav.code)}
        <button
          type="button"
          class="flex items-center gap-1 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-text-muted hover:bg-surface-hover"
          onclick={() => selectStation({ id: 0, name: fav.name, code: fav.code, lines: (fav.meta ?? "").split(" / ") })}
        >
          <Star size={11} class="text-amber-400" fill="currentColor" />
          {fav.name}
        </button>
      {/each}
    </div>
  {/if}

  <button
    type="button"
    class="flex items-center gap-1.5 text-xs font-medium text-text-faint hover:text-text"
    onclick={() => (showFares = true)}
  >
    <CreditCard size={13} />
    Ver tarifas
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
            <ArrivalsList arrivals={group} emptyMessage="Sin trenes próximos." />
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
</section>

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

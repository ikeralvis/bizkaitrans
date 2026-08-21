<script lang="ts">
  import { favorites, type FavoriteStop } from "../lib/shared/favorites.svelte";
  import type { ArrivalEstimate } from "../lib/shared/types";
  import { OPERATOR_LABEL, OPERATOR_COLOR } from "../lib/shared/operators";

  import { getStation } from "../lib/metro/api";
  import { toArrivalEstimates as metroToArrivals } from "../lib/metro/normalize";
  import { getStopArrivalsRaw } from "../lib/bizkaibus/api";
  import { parsePasoParadaXml, toArrivalEstimates as bizkaibusToArrivals } from "../lib/bizkaibus/normalize";
  import { getBilbaoArrivals, filterByStop } from "../lib/renfe/api";
  import { toArrivalEstimates as renfeToArrivals } from "../lib/renfe/normalize";

  import ArrivalsList from "./shared/ArrivalsList.svelte";
  import Spinner from "./shared/Spinner.svelte";
  import { Star, RefreshCw, X } from "@lucide/svelte";

  let arrivalsByStop = $state<Record<string, ArrivalEstimate[]>>({});
  let loadingByStop = $state<Record<string, boolean>>({});
  let errorByStop = $state<Record<string, string>>({});

  function keyOf(fav: FavoriteStop): string {
    return `${fav.operator}:${fav.code}`;
  }

  async function loadOne(fav: FavoriteStop) {
    const key = keyOf(fav);
    loadingByStop[key] = true;
    errorByStop[key] = "";
    try {
      let arrivals: ArrivalEstimate[] = [];
      if (fav.operator === "metro") {
        arrivals = metroToArrivals(await getStation(fav.code));
      } else if (fav.operator === "bizkaibus") {
        const raw = await getStopArrivalsRaw(fav.code);
        arrivals = bizkaibusToArrivals(parsePasoParadaXml(raw.Resultado));
      } else if (fav.operator === "renfe") {
        const all = await getBilbaoArrivals();
        arrivals = renfeToArrivals(filterByStop(all, fav.code)).filter((a) => a.minutesLeft >= -1);
      }
      arrivalsByStop[key] = arrivals.sort((a, b) => a.minutesLeft - b.minutesLeft);
    } catch (e) {
      errorByStop[key] = e instanceof Error ? e.message : "Error desconocido";
    } finally {
      loadingByStop[key] = false;
    }
  }

  function loadAll() {
    for (const fav of favorites.items) loadOne(fav);
  }

  $effect(() => {
    if (favorites.items.length > 0) loadAll();
  });
</script>

<section class="space-y-3">
  {#if favorites.items.length === 0}
    <div class="flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface p-6 text-center">
      <Star size={24} class="text-text-faint" />
      <p class="text-sm text-text-muted">
        Aún no tienes paradas favoritas. Busca una parada en cualquier pestaña de Transportes y toca la estrella
        para guardarla aquí.
      </p>
    </div>
  {:else}
    <div class="flex justify-end">
      <button
        type="button"
        class="flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-text-muted hover:bg-surface-hover"
        onclick={loadAll}
      >
        <RefreshCw size={13} /> Actualizar todo
      </button>
    </div>
    <ul class="space-y-3">
      {#each favorites.items as fav (keyOf(fav))}
        {@const key = keyOf(fav)}
        <li class="rounded-2xl border border-border bg-surface p-4">
          <div class="mb-2 flex items-center justify-between gap-2">
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <span
                  class="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
                  style:background={OPERATOR_COLOR[fav.operator]}
                >
                  {OPERATOR_LABEL[fav.operator]}
                </span>
              </div>
              <p class="mt-1 truncate font-medium">{fav.name}</p>
            </div>
            <button
              type="button"
              class="shrink-0 rounded-full p-1.5 text-text-faint hover:bg-surface-hover hover:text-text"
              onclick={() => favorites.toggle(fav)}
              aria-label="Quitar de favoritos"
            >
              <X size={16} />
            </button>
          </div>

          {#if loadingByStop[key]}
            <p class="flex items-center gap-2 py-1 text-sm text-text-muted"><Spinner size={13} /> Cargando...</p>
          {:else if errorByStop[key]}
            <p class="py-1 text-xs text-red-400">Error: {errorByStop[key]}</p>
          {:else}
            <ArrivalsList arrivals={arrivalsByStop[key] ?? []} emptyMessage="Sin llegadas próximas." />
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</section>

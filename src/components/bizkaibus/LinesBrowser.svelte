<script lang="ts">
  import { getLineList, getLineDetail } from "../../lib/bizkaibus/lines";
  import { getStopArrivalsRaw } from "../../lib/bizkaibus/api";
  import { parsePasoParadaXml, toArrivalEstimates } from "../../lib/bizkaibus/normalize";
  import type { BizkaibusLineSummary, BizkaibusLineDetail } from "../../lib/bizkaibus/types";
  import type { ArrivalEstimate } from "../../lib/shared/types";
  import { favorites } from "../../lib/shared/favorites.svelte";
  import ArrivalsList from "../shared/ArrivalsList.svelte";
  import Spinner from "../shared/Spinner.svelte";
  import { ChevronLeft, Search, Star } from "@lucide/svelte";

  let lines = $state<BizkaibusLineSummary[]>([]);
  let query = $state("");
  let selected = $state<BizkaibusLineSummary | null>(null);
  let detail = $state<BizkaibusLineDetail | null>(null);
  let loading = $state(false);
  let direction = $state<string>("I");

  let expandedStopCode = $state<string | null>(null);
  let stopArrivals = $state<ArrivalEstimate[]>([]);
  let stopLoading = $state(false);

  getLineList().then((list) => {
    lines = list;
  });

  let bizkaibusLineFavoriteIds = $derived(
    new Set(favorites.items.filter((f) => f.operator === "bizkaibus" && f.meta === "line").map((f) => f.code))
  );

  let visibleLines = $derived(
    query.trim().length === 0
      ? lines
      : lines.filter(
          (l) =>
            l.code.toLowerCase().includes(query.trim().toLowerCase()) ||
            l.name.toLowerCase().includes(query.trim().toLowerCase())
        )
  );

  async function selectLine(line: BizkaibusLineSummary) {
    selected = line;
    loading = true;
    detail = await getLineDetail(line.code);
    direction = Object.keys(detail.directions)[0] ?? "I";
    loading = false;
  }

  function back() {
    selected = null;
    detail = null;
  }

  async function toggleStop(code: string) {
    if (expandedStopCode === code) {
      expandedStopCode = null;
      return;
    }
    expandedStopCode = code;
    stopLoading = true;
    try {
      const raw = await getStopArrivalsRaw(code);
      const parsed = parsePasoParadaXml(raw.Resultado);
      stopArrivals = toArrivalEstimates(parsed).sort((a, b) => a.minutesLeft - b.minutesLeft);
    } catch {
      stopArrivals = [];
    } finally {
      stopLoading = false;
    }
  }
</script>

<section class="space-y-3">
  {#if !selected}
    <div class="relative">
      <Search size={16} class="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-text-faint" />
      <input
        type="text"
        placeholder="Buscar línea (ej. A3524, Bermeo...)"
        class="w-full rounded-2xl border border-border bg-surface py-3 pr-4 pl-10 text-sm text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-bizkaibus/50"
        bind:value={query}
      />
    </div>

    {#if lines.length === 0}
      <p class="flex items-center gap-2 py-2 text-sm text-text-muted"><Spinner /> Cargando líneas...</p>
    {:else}
      <div class="grid grid-cols-2 gap-2.5">
        {#each visibleLines as line (line.code)}
          <div
            role="button"
            tabindex="0"
            class="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-3.5 text-left transition-colors hover:bg-surface-hover active:scale-[0.98]"
            onclick={() => selectLine(line)}
            onkeydown={(e) => e.key === "Enter" && selectLine(line)}
          >
            <div class="flex items-start justify-between gap-1">
              <span class="flex h-9 min-w-9 items-center justify-center rounded-xl bg-bizkaibus px-2 text-sm font-bold text-black">
                {line.code}
              </span>
              <button
                type="button"
                class="rounded-full p-1 text-text-faint hover:bg-surface-hover"
                class:text-amber-400={bizkaibusLineFavoriteIds.has(line.code)}
                onclick={(e) => {
                  e.stopPropagation();
                  favorites.toggle({ operator: "bizkaibus", code: line.code, name: `${line.code} · ${line.name}`, meta: "line" });
                }}
                aria-label="Favorito"
              >
                <Star size={14} fill={bizkaibusLineFavoriteIds.has(line.code) ? "currentColor" : "none"} />
              </button>
            </div>
            <span class="line-clamp-2 text-xs leading-snug text-text-muted">{line.name}</span>
          </div>
        {/each}
      </div>
      {#if visibleLines.length === 0}
        <p class="py-6 text-center text-sm text-text-faint">Sin líneas que coincidan con "{query}".</p>
      {/if}
    {/if}
  {:else}
    <button type="button" class="flex items-center gap-1 text-sm text-text-muted hover:text-text" onclick={back}>
      <ChevronLeft size={16} /> Volver a líneas
    </button>

    {#if loading}
      <p class="flex items-center gap-2 py-2 text-sm text-text-muted"><Spinner /> Cargando línea...</p>
    {:else if detail}
      <div class="rounded-2xl border border-border bg-surface p-4">
        <p class="mb-2 flex items-center gap-2">
          <span class="rounded-full bg-bizkaibus px-2 py-0.5 text-xs font-bold text-black">{detail.code}</span>
          <span class="text-sm font-medium">{detail.name}</span>
        </p>

        <div class="mb-3 flex flex-wrap gap-1">
          {#each Object.keys(detail.directions) as dir (dir)}
            <button
              type="button"
              class="rounded-full px-3 py-1 text-xs font-medium transition-colors"
              class:bg-bizkaibus={direction === dir}
              class:text-black={direction === dir}
              class:bg-surface-hover={direction !== dir}
              class:text-text-muted={direction !== dir}
              onclick={() => (direction = dir)}
            >
              {dir === "I" ? "Ida" : "Vuelta"}
            </button>
          {/each}
        </div>

        <p class="mb-1 text-xs text-text-faint">Toca una parada para ver sus próximos autobuses.</p>
        <ol class="divide-y divide-border border-t border-border">
          {#each detail.directions[direction] ?? [] as stop, i (stop.code + i)}
            <li>
              <button
                type="button"
                class="flex w-full items-center gap-3 py-2 text-left text-sm"
                onclick={() => toggleStop(stop.code)}
              >
                <span class="w-5 shrink-0 text-right text-xs text-text-faint">{i + 1}</span>
                <span class="truncate">{stop.name}</span>
              </button>
              {#if expandedStopCode === stop.code}
                <div class="pb-2 pl-8">
                  {#if stopLoading}
                    <p class="flex items-center gap-2 text-xs text-text-muted"><Spinner size={13} /> Cargando...</p>
                  {:else}
                    <ArrivalsList arrivals={stopArrivals} emptyMessage="Sin autobuses próximos en esta parada." />
                  {/if}
                </div>
              {/if}
            </li>
          {/each}
        </ol>
      </div>
    {/if}
  {/if}
</section>

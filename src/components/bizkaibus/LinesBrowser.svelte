<script lang="ts">
  import { getLineList, getLineDetail } from "../../lib/bizkaibus/lines";
  import type { BizkaibusLineSummary, BizkaibusLineDetail } from "../../lib/bizkaibus/types";
  import { debounce } from "../../lib/shared/debounce";
  import SearchDropdown from "../shared/SearchDropdown.svelte";
  import Spinner from "../shared/Spinner.svelte";
  import { ChevronLeft } from "@lucide/svelte";

  let lines = $state<BizkaibusLineSummary[]>([]);
  let query = $state("");
  let selected = $state<BizkaibusLineSummary | null>(null);
  let detail = $state<BizkaibusLineDetail | null>(null);
  let loading = $state(false);
  let direction = $state<string>("I");

  getLineList().then((list) => {
    lines = list;
  });

  let filtered = $derived(
    query.trim().length === 0
      ? []
      : lines
          .filter(
            (l) =>
              l.code.toLowerCase().includes(query.trim().toLowerCase()) ||
              l.name.toLowerCase().includes(query.trim().toLowerCase())
          )
          .slice(0, 8)
  );


  async function selectLine(line: BizkaibusLineSummary) {
    selected = line;
    query = "";
    loading = true;
    detail = await getLineDetail(line.code);
    direction = Object.keys(detail.directions)[0] ?? "I";
    loading = false;
  }

  function back() {
    selected = null;
    detail = null;
  }
</script>

<section class="space-y-3">
  {#if !selected}
    <div class="relative">
      <input
        type="text"
        placeholder="Buscar línea (ej. A3524, Bermeo...)"
        class="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-bizkaibus/50"
        bind:value={query}
      />
      <SearchDropdown items={filtered} getKey={(l) => l.code} onSelect={selectLine}>
        {#snippet item(l: BizkaibusLineSummary)}
          <span class="shrink-0 rounded-full bg-bizkaibus/10 px-2 py-0.5 text-xs font-semibold text-bizkaibus">
            {l.code}
          </span>
          <span class="truncate text-xs text-text-muted">{l.name}</span>
        {/snippet}
      </SearchDropdown>
    </div>
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

        <ol class="divide-y divide-border border-t border-border">
          {#each detail.directions[direction] ?? [] as stop, i (stop.code + i)}
            <li class="flex items-center gap-3 py-2 text-sm">
              <span class="w-5 shrink-0 text-right text-xs text-text-faint">{i + 1}</span>
              <span class="truncate">{stop.name}</span>
            </li>
          {/each}
        </ol>
      </div>
    {/if}
  {/if}
</section>

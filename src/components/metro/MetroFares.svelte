<script lang="ts">
  import { getFares } from "../../lib/metro/api";
  import type { MetroFareItem } from "../../lib/metro/types";
  import { stripHtml } from "../../lib/shared/stripHtml";
  import Spinner from "../shared/Spinner.svelte";
  import BottomSheet from "../shared/BottomSheet.svelte";
  import { CreditCard } from "@lucide/svelte";

  let fares = $state<MetroFareItem[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let detail = $state<MetroFareItem | null>(null);

  getFares()
    .then((res) => {
      fares = res.configuration.slider;
    })
    .catch((e) => {
      error = e instanceof Error ? e.message : "Error desconocido";
    })
    .finally(() => {
      loading = false;
    });
</script>

<section>
  {#if loading}
    <p class="flex items-center gap-2 py-2 text-sm text-text-muted"><Spinner /> Cargando tarifas...</p>
  {:else if error}
    <p class="py-2 text-sm text-red-400">Error: {error}</p>
  {:else}
    <div class="grid grid-cols-2 gap-2.5">
      {#each fares as fare (fare.code)}
        <button
          type="button"
          class="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-3.5 text-left transition-colors hover:bg-surface-hover active:scale-[0.98]"
          onclick={() => (detail = fare)}
        >
          <CreditCard size={18} class="text-metro" />
          <span class="text-sm font-semibold">{fare.name}</span>
          {#if fare.subTitle}
            <span class="line-clamp-2 text-xs text-text-faint">{stripHtml(fare.subTitle)}</span>
          {/if}
        </button>
      {/each}
    </div>
  {/if}
</section>

{#if detail}
  <BottomSheet title={detail.name} onClose={() => (detail = null)}>
    <div class="space-y-2 text-sm whitespace-pre-line text-text-muted">
      {#if detail.personal}<p>{stripHtml(detail.personal)}</p>{/if}
      <p>{stripHtml(detail.terms)}</p>
    </div>
  </BottomSheet>
{/if}

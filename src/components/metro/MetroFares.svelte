<script lang="ts">
  import { getFares } from "../../lib/metro/api";
  import type { MetroFareItem } from "../../lib/metro/types";
  import { stripHtml } from "../../lib/shared/stripHtml";
  import Spinner from "../shared/Spinner.svelte";
  import { ChevronDown, CreditCard } from "@lucide/svelte";

  let fares = $state<MetroFareItem[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let expanded = $state<string | null>(null);

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

  function toggle(code: string) {
    expanded = expanded === code ? null : code;
  }
</script>

<section class="space-y-2">
  {#if loading}
    <p class="flex items-center gap-2 py-2 text-sm text-text-muted"><Spinner /> Cargando tarifas...</p>
  {:else if error}
    <p class="py-2 text-sm text-red-400">Error: {error}</p>
  {:else}
    <ul class="space-y-2">
      {#each fares as fare (fare.code)}
        <li class="rounded-2xl border border-border bg-surface">
          <button
            type="button"
            class="flex w-full items-center gap-2 p-3 text-left"
            onclick={() => toggle(fare.code)}
          >
            <CreditCard size={16} class="shrink-0 text-metro" />
            <span class="min-w-0 flex-1">
              <span class="block truncate text-sm font-medium">{fare.name}</span>
              {#if fare.subTitle}
                <span class="block truncate text-xs text-text-faint">{stripHtml(fare.subTitle)}</span>
              {/if}
            </span>
            <span
              class="shrink-0 text-text-faint transition-transform"
              class:rotate-180={expanded === fare.code}
            >
              <ChevronDown size={16} />
            </span>
          </button>
          {#if expanded === fare.code}
            <div class="space-y-1 border-t border-border px-3 py-2.5 text-xs whitespace-pre-line text-text-muted">
              {#if fare.personal}<p>{stripHtml(fare.personal)}</p>{/if}
              <p>{stripHtml(fare.terms)}</p>
            </div>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</section>

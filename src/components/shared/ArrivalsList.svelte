<script lang="ts">
  import type { ArrivalEstimate } from "../../lib/shared/types";
  import { OPERATOR_COLOR } from "../../lib/shared/operators";

  interface Props {
    arrivals: ArrivalEstimate[];
    emptyMessage?: string;
    live?: boolean;
  }

  let { arrivals, emptyMessage = "Sin llegadas próximas.", live = true }: Props = $props();
</script>

{#if arrivals.length === 0}
  <p class="py-3 text-sm text-text-faint">{emptyMessage}</p>
{:else}
  <ul class="divide-y divide-border">
    {#each arrivals as train, i (train.lineId + train.headsign + train.minutesLeft + i)}
      <li class="flex items-center gap-3 py-3">
        <span
          class="flex h-9 min-w-9 shrink-0 items-center justify-center rounded-xl px-2 text-sm font-bold text-white"
          style:background={OPERATOR_COLOR[train.operator]}
        >
          {train.lineId}
        </span>
        <span class="min-w-0 flex-1">
          <span class="block truncate text-base font-medium text-text">{train.headsign}</span>
          {#if live}
            <span class="mt-0.5 flex items-center gap-1 text-[10px] font-semibold tracking-wide text-emerald-400 uppercase">
              <span class="h-1.5 w-1.5 animate-live-pulse rounded-full bg-emerald-400"></span>
              En vivo
            </span>
          {/if}
        </span>
        <span class="shrink-0 text-2xl font-bold tabular-nums">
          {train.minutesLeft <= 0 ? "Ahora" : `${train.minutesLeft}′`}
        </span>
      </li>
    {/each}
  </ul>
{/if}

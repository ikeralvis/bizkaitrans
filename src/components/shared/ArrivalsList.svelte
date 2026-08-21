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
      <li class="flex items-center gap-3 py-2.5">
        <span
          class="shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold text-white"
          style:background={OPERATOR_COLOR[train.operator]}
        >
          {train.lineId}
        </span>
        <span class="flex-1 truncate text-sm text-text-muted">{train.headsign}</span>
        <span class="flex shrink-0 items-center gap-1.5">
          {#if live}
            <span class="flex items-center gap-1 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-emerald-400 uppercase">
              <span class="h-1.5 w-1.5 animate-live-pulse rounded-full bg-emerald-400"></span>
              En vivo
            </span>
          {/if}
          <span class="text-sm font-semibold tabular-nums">
            {train.minutesLeft <= 0 ? "Ahora" : `${train.minutesLeft} min`}
          </span>
        </span>
      </li>
    {/each}
  </ul>
{/if}

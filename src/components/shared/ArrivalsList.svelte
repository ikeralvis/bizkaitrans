<script lang="ts">
  import type { ArrivalEstimate } from "../../lib/shared/types";
  import { OPERATOR_COLOR } from "../../lib/shared/operators";

  interface Props {
    arrivals: ArrivalEstimate[];
    emptyMessage?: string;
  }

  let { arrivals, emptyMessage = "Sin llegadas próximas." }: Props = $props();
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
        <span class="shrink-0 text-sm font-semibold tabular-nums">
          {train.minutesLeft <= 0 ? "Ahora" : `${train.minutesLeft} min`}
        </span>
      </li>
    {/each}
  </ul>
{/if}

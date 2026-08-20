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
  <p class="empty">{emptyMessage}</p>
{:else}
  <ul class="arrivals">
    {#each arrivals as train, i (train.lineId + train.headsign + train.minutesLeft + i)}
      <li>
        <span class="line-badge" style:background={OPERATOR_COLOR[train.operator]}>{train.lineId}</span>
        <span class="headsign">{train.headsign}</span>
        <span class="minutes">{train.minutesLeft <= 0 ? "Ahora" : `${train.minutesLeft} min`}</span>
      </li>
    {/each}
  </ul>
{/if}

<style>
  .arrivals {
    list-style: none;
    padding: 0;
    margin: 0.5rem 0;
  }
  .arrivals li {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 0;
    border-bottom: 1px solid #eee;
  }
  .line-badge {
    color: white;
    font-weight: bold;
    padding: 0.15rem 0.5rem;
    border-radius: 4px;
    font-size: 0.85rem;
    white-space: nowrap;
  }
  .headsign {
    flex: 1;
  }
  .minutes {
    font-weight: bold;
  }
  .empty {
    color: #666;
  }
</style>

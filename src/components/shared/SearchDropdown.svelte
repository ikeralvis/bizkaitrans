<script lang="ts" generics="T">
  import type { Snippet } from "svelte";

  interface Props {
    items: T[];
    getKey: (item: T) => string | number;
    onSelect: (item: T) => void;
    item: Snippet<[T]>;
  }

  let { items, getKey, onSelect, item }: Props = $props();
</script>

{#if items.length > 0}
  <ul
    class="absolute z-10 mt-1 max-h-80 w-full overflow-y-auto rounded-2xl border border-border bg-surface p-1 shadow-2xl shadow-black/50"
  >
    {#each items as entry (getKey(entry))}
      <li>
        <button
          type="button"
          class="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-surface-hover"
          onclick={() => onSelect(entry)}
        >
          {@render item(entry)}
        </button>
      </li>
    {/each}
  </ul>
{/if}

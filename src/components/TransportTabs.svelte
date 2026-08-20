<script lang="ts">
  import type { Component } from "svelte";
  import { TrainFront, Bus, BusFront, Train } from "@lucide/svelte";
  import { OPERATOR_LABEL, OPERATOR_COLOR } from "../lib/shared/operators";
  import type { Operator } from "../lib/shared/types";

  const TABS: { id: Operator; icon: Component }[] = [
    { id: "metro", icon: TrainFront },
    { id: "bilbobus", icon: Bus },
    { id: "bizkaibus", icon: BusFront },
    { id: "renfe", icon: Train },
  ];

  const loaders: Record<Operator, () => Promise<{ default: Component }>> = {
    metro: () => import("./MetroBlock.svelte"),
    bilbobus: () => import("./BilbobusBlock.svelte"),
    bizkaibus: () => import("./BizkaibusBlock.svelte"),
    renfe: () => import("./RenfeBlock.svelte"),
  };

  let active = $state<Operator>("metro");
  let loaded = $state<Partial<Record<Operator, Component>>>({});

  async function activate(id: Operator) {
    active = id;
    if (!loaded[id]) {
      const mod = await loaders[id]();
      loaded[id] = mod.default;
    }
  }

  activate("metro");
</script>

<div class="mx-auto max-w-md">
  <div class="sticky top-0 z-20 -mx-4 mb-4 border-b border-border bg-background/80 px-4 pt-2 pb-1 backdrop-blur-xl">
    <div class="flex gap-1 rounded-2xl bg-surface p-1 ring-1 ring-border">
      {#each TABS as tab (tab.id)}
        {@const Icon = tab.icon}
        <button
          type="button"
          class="flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-xs font-medium transition-colors"
          class:text-text={active === tab.id}
          class:bg-surface-hover={active === tab.id}
          class:text-text-faint={active !== tab.id}
          style:color={active === tab.id ? OPERATOR_COLOR[tab.id] : undefined}
          onclick={() => activate(tab.id)}
        >
          <Icon size={18} />
          {OPERATOR_LABEL[tab.id]}
        </button>
      {/each}
    </div>
  </div>

  {#each TABS as tab (tab.id)}
    <div class:hidden={active !== tab.id}>
      {#if loaded[tab.id]}
        {@const Block = loaded[tab.id]}
        <Block />
      {:else if active === tab.id}
        <div class="animate-pulse space-y-3 rounded-2xl bg-surface p-4 ring-1 ring-border">
          <div class="h-10 rounded-xl bg-surface-hover"></div>
          <div class="h-4 w-2/3 rounded bg-surface-hover"></div>
          <div class="h-4 w-1/2 rounded bg-surface-hover"></div>
        </div>
      {/if}
    </div>
  {/each}
</div>

<script lang="ts">
  import type { Component } from "svelte";
  import { TrainFront, Bus, BusFront, Train } from "@lucide/svelte";
  import { OPERATOR_COLOR } from "../lib/shared/operators";
  import type { Operator } from "../lib/shared/types";

  const NAV_LABEL: Record<Operator, string> = {
    metro: "Metro",
    bilbobus: "Bilbobus",
    bizkaibus: "Bizkaibus",
    renfe: "Renfe",
  };

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

<div class="mx-auto max-w-md px-4 pt-2 pb-24">
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

<nav
  class="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/70 backdrop-blur-lg"
  style="padding-bottom: env(safe-area-inset-bottom)"
>
  <div class="mx-auto flex max-w-md">
    {#each TABS as tab (tab.id)}
      {@const Icon = tab.icon}
      <button
        type="button"
        class="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-text-faint transition-all active:scale-95"
        style:color={active === tab.id ? OPERATOR_COLOR[tab.id] : undefined}
        onclick={() => activate(tab.id)}
      >
        <Icon size={20} strokeWidth={active === tab.id ? 2.5 : 2} />
        {NAV_LABEL[tab.id]}
      </button>
    {/each}
  </div>
</nav>

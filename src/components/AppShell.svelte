<script lang="ts">
  import type { Component } from "svelte";
  import { Home, Bus, Route, TriangleAlert } from "@lucide/svelte";
  import TransportTabs from "./TransportTabs.svelte";
  import HomeBlock from "./HomeBlock.svelte";
  import RoutePlanner from "./metro/RoutePlanner.svelte";
  import MetroAlerts from "./metro/MetroAlerts.svelte";

  type SectionId = "home" | "transport" | "routes" | "alerts";

  const SECTIONS: { id: SectionId; label: string; icon: Component }[] = [
    { id: "home", label: "Inicio", icon: Home },
    { id: "transport", label: "Transportes", icon: Bus },
    { id: "routes", label: "Rutas", icon: Route },
    { id: "alerts", label: "Alertas", icon: TriangleAlert },
  ];

  let active = $state<SectionId>("home");
  let visited = $state<Partial<Record<SectionId, boolean>>>({ home: true });

  function activate(id: SectionId) {
    active = id;
    visited[id] = true;
  }
</script>

<div class="mx-auto max-w-md pb-20">
  <div class="px-4 pt-2">
    {#if active === "home"}
      <HomeBlock />
    {/if}
    {#if visited["transport"]}
      <div class:hidden={active !== "transport"}>
        <TransportTabs />
      </div>
    {/if}
    {#if visited["routes"]}
      <div class:hidden={active !== "routes"}>
        <RoutePlanner />
      </div>
    {/if}
    {#if visited["alerts"]}
      <div class:hidden={active !== "alerts"}>
        <MetroAlerts />
      </div>
    {/if}
  </div>
</div>

<nav
  class="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/90 backdrop-blur-xl"
  style="padding-bottom: env(safe-area-inset-bottom)"
>
  <div class="mx-auto flex max-w-md">
    {#each SECTIONS as section (section.id)}
      {@const Icon = section.icon}
      <button
        type="button"
        class="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-text-faint transition-colors"
        class:text-text={active === section.id}
        onclick={() => activate(section.id)}
      >
        <Icon size={20} />
        {section.label}
      </button>
    {/each}
  </div>
</nav>

<script lang="ts">
  import { Sun, Moon, MonitorSmartphone } from "@lucide/svelte";

  type ThemeChoice = "light" | "dark" | "system";
  const STORAGE_KEY = "bizkaitrans:theme";
  const ORDER: ThemeChoice[] = ["system", "light", "dark"];

  function readInitial(): ThemeChoice {
    if (typeof localStorage === "undefined") return "system";
    const v = localStorage.getItem(STORAGE_KEY);
    return v === "light" || v === "dark" ? v : "system";
  }

  let choice = $state<ThemeChoice>(readInitial());

  function apply(next: ThemeChoice) {
    choice = next;
    const root = document.documentElement;
    if (next === "system") {
      root.removeAttribute("data-theme");
      localStorage.removeItem(STORAGE_KEY);
    } else {
      root.setAttribute("data-theme", next);
      localStorage.setItem(STORAGE_KEY, next);
    }
  }

  function cycle() {
    const next = ORDER[(ORDER.indexOf(choice) + 1) % ORDER.length];
    apply(next);
  }
</script>

<button
  type="button"
  class="rounded-full border border-border bg-surface p-2 text-text-muted hover:bg-surface-hover"
  onclick={cycle}
  aria-label="Cambiar tema ({choice})"
  title="Tema: {choice}"
>
  {#if choice === "system"}
    <MonitorSmartphone size={16} />
  {:else if choice === "light"}
    <Sun size={16} />
  {:else}
    <Moon size={16} />
  {/if}
</button>

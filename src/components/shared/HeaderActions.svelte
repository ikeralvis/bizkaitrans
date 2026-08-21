<script lang="ts">
  import { Settings, Star } from "@lucide/svelte";
  import SettingsSheet from "./SettingsSheet.svelte";
  import BottomSheet from "./BottomSheet.svelte";
  import HomeBlock from "../HomeBlock.svelte";

  let showSettings = $state(false);
  let showFavorites = $state(false);
</script>

<div class="flex items-center gap-1">
  <button
    type="button"
    class="rounded-full border border-border bg-surface p-2 text-text-muted hover:bg-surface-hover"
    onclick={() => (showFavorites = true)}
    aria-label="Favoritos"
  >
    <Star size={16} />
  </button>
  <button
    type="button"
    class="rounded-full border border-border bg-surface p-2 text-text-muted hover:bg-surface-hover"
    onclick={() => (showSettings = true)}
    aria-label="Ajustes"
  >
    <Settings size={16} />
  </button>
</div>

{#if showSettings}
  <SettingsSheet onClose={() => (showSettings = false)} />
{/if}

{#if showFavorites}
  <BottomSheet title="Favoritos" onClose={() => (showFavorites = false)}>
    <HomeBlock />
  </BottomSheet>
{/if}

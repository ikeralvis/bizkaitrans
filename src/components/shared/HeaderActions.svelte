<script lang="ts">
  import { Settings } from "@lucide/svelte";
  import SettingsSheet from "./SettingsSheet.svelte";

  let showSettings = $state(false);
</script>

<button
  type="button"
  class="rounded-full border border-border bg-surface p-2 text-text-muted hover:bg-surface-hover"
  onclick={() => (showSettings = true)}
  aria-label="Ajustes"
>
  <Settings size={16} />
</button>

{#if showSettings}
  <SettingsSheet onClose={() => (showSettings = false)} />
{/if}

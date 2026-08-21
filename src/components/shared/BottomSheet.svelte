<script lang="ts">
  import { fade, fly } from "svelte/transition";
  import { X } from "@lucide/svelte";
  import type { Snippet } from "svelte";

  interface Props {
    title: string;
    onClose: () => void;
    children: Snippet;
  }
  let { title, onClose, children }: Props = $props();
</script>

<div class="fixed inset-0 z-40 flex items-end justify-center" role="dialog" aria-modal="true" aria-label={title}>
  <button
    type="button"
    class="absolute inset-0 bg-black/60 backdrop-blur-sm"
    aria-label="Cerrar"
    onclick={onClose}
    transition:fade={{ duration: 150 }}
  ></button>

  <div
    class="relative z-10 max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-3xl border-t border-x border-border bg-surface/95 shadow-2xl shadow-black/50 backdrop-blur-xl"
    transition:fly={{ y: 200, duration: 220 }}
  >
    <div class="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface/95 px-4 py-3 backdrop-blur-xl">
      <h2 class="font-semibold">{title}</h2>
      <button type="button" class="rounded-full p-1.5 text-text-faint hover:bg-surface-hover hover:text-text" onclick={onClose} aria-label="Cerrar">
        <X size={18} />
      </button>
    </div>
    <div class="p-4">
      {@render children()}
    </div>
  </div>
</div>

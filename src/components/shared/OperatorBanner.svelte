<script lang="ts">
  import type { Component, Snippet } from "svelte";

  interface Props {
    color: string;
    title: string;
    logo?: string;
    illustration?: string;
    /** "brand" shows the illustration large, in its own colors, as a hero graphic. "faint" (default) is a small inverted-white watermark. */
    illustrationVariant?: "faint" | "brand";
    icon?: Component;
    actions?: Snippet;
  }
  let { color, title, logo, illustration, illustrationVariant = "faint", icon: Icon, actions }: Props = $props();
</script>

<div class="relative mb-4 overflow-hidden rounded-3xl" style:background={color}>
  <div class="absolute inset-0 bg-gradient-to-br from-black/0 via-black/5 to-black/40"></div>

  {#if illustration && illustrationVariant === "brand"}
    <img
      src={illustration}
      alt=""
      class="pointer-events-none absolute top-1/2 right-0 h-full w-2/3 -translate-y-1/2 object-cover object-right opacity-70"
      style="mask-image: linear-gradient(to right, transparent, black 45%); -webkit-mask-image: linear-gradient(to right, transparent, black 45%);"
    />
  {:else if illustration}
    <img
      src={illustration}
      alt=""
      class="pointer-events-none absolute -right-3 -bottom-3 h-24 w-24 opacity-25 [filter:brightness(0)_invert(1)]"
    />
  {:else if Icon}
    <Icon size={100} strokeWidth={1.5} class="pointer-events-none absolute -right-4 -bottom-4 text-white/15" />
  {/if}

  <div class="relative flex items-center justify-between gap-2 px-5 py-4">
    {#if logo}
      <img src={logo} alt={title} class="h-6 w-auto drop-shadow-sm" />
    {:else}
      <h2 class="text-lg font-bold text-white drop-shadow-sm">{title}</h2>
    {/if}
    {#if actions}
      <div class="flex items-center gap-1">{@render actions()}</div>
    {/if}
  </div>
</div>

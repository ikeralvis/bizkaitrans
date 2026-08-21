<script lang="ts">
  import { favorites, type FavoriteStop } from "../../lib/shared/favorites.svelte";
  import { Star } from "@lucide/svelte";

  interface Props {
    stop: FavoriteStop;
  }
  let { stop }: Props = $props();

  let isFav = $derived(favorites.isFavorite(stop.operator, stop.code));
</script>

<button
  type="button"
  class="rounded-full p-1.5 text-text-faint hover:bg-surface-hover"
  class:text-amber-400={isFav}
  onclick={() => favorites.toggle(stop)}
  aria-label={isFav ? "Quitar de favoritos" : "Añadir a favoritos"}
  aria-pressed={isFav}
>
  <Star size={16} fill={isFav ? "currentColor" : "none"} />
</button>

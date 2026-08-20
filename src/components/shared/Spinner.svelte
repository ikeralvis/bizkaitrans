<script lang="ts">
  interface Props {
    size?: number;
  }
  let { size = 16 }: Props = $props();
</script>

<span
  class="inline-block animate-spin rounded-full border-2 border-text-faint/30 border-t-text-muted align-middle"
  style:width="{size}px"
  style:height="{size}px"
  aria-label="Cargando"
></span>

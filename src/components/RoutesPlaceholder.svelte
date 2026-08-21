<script lang="ts">
  import { Waypoints } from "@lucide/svelte";
</script>

<section class="flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface p-8 text-center">
  <div class="rounded-full bg-surface-hover p-3">
    <Waypoints size={22} class="text-text-faint" />
  </div>
  <div>
    <p class="font-semibold">Planificador intermodal</p>
    <p class="mt-1 text-sm text-text-muted">
      Próximamente: calcula un trayecto combinando Metro, Bilbobus, Bizkaibus y Renfe. Mientras tanto, cada
      operador tiene su propio buscador de ruta en la pestaña Transportes.
    </p>
  </div>
</section>

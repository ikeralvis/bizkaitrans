<script lang="ts">
  import BottomSheet from "./BottomSheet.svelte";
  import { Sun, Moon, MonitorSmartphone } from "@lucide/svelte";

  interface Props {
    onClose: () => void;
  }
  let { onClose }: Props = $props();

  type ThemeChoice = "light" | "dark" | "system";
  const STORAGE_KEY = "bizkaitrans:theme";

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

  const OPTIONS: { id: ThemeChoice; label: string; icon: typeof Sun }[] = [
    { id: "system", label: "Sistema", icon: MonitorSmartphone },
    { id: "light", label: "Claro", icon: Sun },
    { id: "dark", label: "Oscuro", icon: Moon },
  ];
</script>

<BottomSheet title="Ajustes" {onClose}>
  <div class="space-y-4">
    <div>
      <p class="mb-2 text-xs font-medium tracking-wide text-text-faint uppercase">Apariencia</p>
      <div class="flex gap-1 rounded-2xl bg-surface-hover p-1 ring-1 ring-border">
        {#each OPTIONS as opt (opt.id)}
          {@const Icon = opt.icon}
          <button
            type="button"
            class="flex flex-1 flex-col items-center gap-1 rounded-xl py-2.5 text-xs font-medium transition-colors"
            class:bg-surface={choice === opt.id}
            class:text-text={choice === opt.id}
            class:text-text-faint={choice !== opt.id}
            onclick={() => apply(opt.id)}
          >
            <Icon size={17} />
            {opt.label}
          </button>
        {/each}
      </div>
    </div>

    <div class="rounded-2xl border border-border bg-surface p-3.5 text-xs text-text-faint">
      <p class="mb-1 font-medium text-text-muted">Bizkaitrans</p>
      <p>Metro Bilbao · Bilbobus · Bizkaibus · Renfe Cercanías, en una sola app. Los favoritos se guardan solo en este dispositivo.</p>
    </div>

    <div>
      <p class="mb-2 text-xs font-medium tracking-wide text-text-faint uppercase">Fuentes de datos</p>
      <ul class="space-y-1.5 rounded-2xl border border-border bg-surface p-3.5 text-xs text-text-faint">
        <li class="flex items-center gap-2">
          <span class="h-2 w-2 shrink-0 rounded-full" style:background="var(--color-metro)"></span>
          Metro Bilbao S.A. — api.metrobilbao.eus (horarios y avisos oficiales)
        </li>
        <li class="flex items-center gap-2">
          <span class="h-2 w-2 shrink-0 rounded-full" style:background="var(--color-bilbobus)"></span>
          Bilbobus / Ayto. de Bilbao — datos abiertos GTFS y GTFS-RT de bilbao.eus
        </li>
        <li class="flex items-center gap-2">
          <span class="h-2 w-2 shrink-0 rounded-full" style:background="var(--color-bizkaibus)"></span>
          Bizkaibus / Diputación Foral de Bizkaia — Open Data Euskadi
        </li>
        <li class="flex items-center gap-2">
          <span class="h-2 w-2 shrink-0 rounded-full" style:background="var(--color-renfe)"></span>
          Renfe Cercanías / Adif — gtfsrt.renfe.com
        </li>
      </ul>
      <p class="mt-2 text-[11px] leading-relaxed text-text-faint">
        Bizkaitrans es un proyecto independiente y no oficial, sin afiliación con ninguno de los operadores
        anteriores. Los datos mostrados son propiedad de cada operador y se muestran tal cual los publican sus
        fuentes oficiales.
      </p>
    </div>
  </div>
</BottomSheet>

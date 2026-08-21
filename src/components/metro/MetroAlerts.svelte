<script lang="ts">
  import { getIncidents } from "../../lib/metro/api";
  import type { MetroIncident } from "../../lib/metro/types";
  import { stripHtml } from "../../lib/shared/stripHtml";
  import Spinner from "../shared/Spinner.svelte";
  import { TriangleAlert, MapPin } from "@lucide/svelte";

  let incidents = $state<MetroIncident[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);

  getIncidents()
    .then((res) => {
      const { service_issue, installation_issue, issue_special_service } = res.configuration.incidences;
      incidents = [...service_issue, ...installation_issue, ...issue_special_service];
    })
    .catch((e) => {
      error = e instanceof Error ? e.message : "Error desconocido";
    })
    .finally(() => {
      loading = false;
    });
</script>

<section class="space-y-3">
  {#if loading}
    <p class="flex items-center gap-2 py-2 text-sm text-text-muted"><Spinner /> Cargando avisos...</p>
  {:else if error}
    <p class="py-2 text-sm text-red-400">Error: {error}</p>
  {:else if incidents.length === 0}
    <div class="rounded-2xl border border-border bg-surface p-4 text-center text-sm text-text-muted">
      Sin incidencias activas en la red de Metro Bilbao.
    </div>
  {:else}
    <ul class="space-y-2">
      {#each incidents as incident, i (i)}
        <li class="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3">
          <div class="flex items-start gap-2">
            <TriangleAlert size={16} class="mt-0.5 shrink-0 text-amber-400" />
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium">{incident.title}</p>
              {#if incident.description}
                <p class="mt-1 text-xs whitespace-pre-line text-text-muted">{stripHtml(incident.description)}</p>
              {/if}
              {#if incident.station}
                <p class="mt-1.5 flex items-center gap-1 text-xs text-text-faint">
                  <MapPin size={12} />
                  {incident.station.name}{incident.exit ? ` · ${incident.exit}` : ""}
                </p>
              {/if}
            </div>
          </div>
        </li>
      {/each}
    </ul>
  {/if}
</section>

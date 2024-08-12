<script lang="ts">
    import { getContext } from "svelte"
    import type { Writable } from "svelte/store"
    import type { FSStore } from "../store"

    const fsStore = getContext<Writable<FSStore>>("fs_store")
</script>

<div class="w-full h-fit rounded-2xl overflow-hidden divide-y-2 divide-surface-container-low">
    {#each $fsStore.logs as log}
        <div class="bg-surface w-full h-fit p-1 px-2">
            <span class="text-primary font-medium text-xs">{log.type}</span>
            |
            <span class="text-primary text-xs">{log.event}</span>
            |
            <span class="text-primary text-xs">{log.paths ?? log.error}</span>
            |
            <span class="text-primary text-xs">{new Date(log.ts)}</span>
        </div>
    {/each}
</div>
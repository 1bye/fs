<script lang="ts">
    import type { StorageFile } from "$lib/types/storage";
    import { Button, Icon } from "m3-svelte";
    import BaselineMoreVert from "@ktibow/iconset-ic/baseline-more-vert"
    import convert from "convert";

    type $$Props = {
        file: StorageFile;
        processing?: boolean;
    }

    export let file: $$Props["file"];
    export let processing: $$Props["processing"] = false;

    $: fileSize = convert(file.size, "bytes").to("best");
</script>

<div data-storage-file-id="{file.id ?? 'unknown'}" class="w-60 h-52 bg-surface-container hover:bg-surface cursor-pointer transition-colors rounded-2xl p-2 gap-2 flex flex-col" role="listitem">
    <div class="w-full h-32">
        <img class="w-full" src="/images/file-fallback.png" alt="File preview fallback" />
    </div>

    <div class="w-full flex">
        <div class="w-full flex flex-col gap-2">
            <div class="w-full flex flex-col">
                <h3 class="text-primary font-medium text-base">{file.name}</h3>
                <span class="text-secondary font-medium text-xss">
                    {fileSize.quantity} {fileSize.unit}
                    ·
                    PowerPoint
                </span>
            </div>

            {#if file.tags.length > 0}
                <div class="flex flex-wrap">
                    {#each file.tags as tag}
                        <span class="bg-secondary px-2 text-on-primary font-medium text-xss">{tag.name}</span>
                    {/each}
                </div>
            {/if}
        </div>

        <Button type="text" iconType="full">
            <Icon class="text-secondary-container" icon={BaselineMoreVert} />
        </Button>
    </div>
</div>
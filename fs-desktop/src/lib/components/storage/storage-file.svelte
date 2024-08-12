<script lang="ts">
    import type { StorageFile } from "$lib/types/storage";
    import { Button, Icon } from "m3-svelte";
    import BaselineMoreVert from "@ktibow/iconset-ic/baseline-more-vert"
    import convert from "convert";
    import { truncate } from "$lib/utils/text";
    import { BaseLoading } from "$lib/components/base";

    type $$Props = {
        file: StorageFile;
        processing?: boolean;
    }

    export let file: $$Props["file"];
    export let processing: $$Props["processing"] = false;

    $: fileSize = convert(file.size, "bytes").to("best");
</script>

<div on:keydown tabindex="0" data-storage-file-id="{file.id ?? 'unknown'}" class="max-w-96 w-fit h-fit bg-surface-container hover:bg-surface cursor-pointer transition-colors rounded-2xl p-2 gap-2 flex" role="menuitem">
    <div class="w-fit overflow-hidden rounded-lg h-fit relative">
        {#if processing}
            <div class="absolute top-1 left-1">
                <BaseLoading />
            </div>
        {/if}

        <img class="w-fit max-h-20 object-cover" src="/images/file-fallback.png" alt="File preview fallback" />
    </div>

    <button on:click class="w-fit flex min-w-40">
        <div class="w-fit flex flex-col gap-2">
            <div class="w-fit flex flex-col">
                <h3 class="text-primary font-medium text-base sm:text-lg">{truncate(file.name, 15)}</h3>
                <span class="text-secondary font-medium text-xss sm:text-xs">
                    {fileSize.quantity} {fileSize.unit}
                    ·
                    Image
                </span>
            </div>

            {#if file.tags.length > 0}
                <div class="flex flex-wrap gap-1">
                    {#each file.tags.slice(0, 2) as tag}
                        <span class="bg-secondary rounded-full select-none px-2 text-on-primary font-medium text-xss">{tag.name}</span>
                    {/each}
                </div>
            {/if}
        </div>

        <Button type="text" iconType="full">
            <Icon class="text-secondary-container" icon={BaselineMoreVert} />
        </Button>
    </button>
</div>
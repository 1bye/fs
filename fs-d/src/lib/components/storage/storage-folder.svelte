<script lang="ts">
    import type { StorageTreeFolder } from "$lib/types/storage";
    import { Button, Icon } from "m3-svelte";
    import BaselineMoreVert from "@ktibow/iconset-ic/baseline-more-vert"
    import BaselineFolder from "@ktibow/iconset-ic/baseline-folder"
    import convert from "convert";
    import { sortTagsByTagCount } from "$lib/utils/storage/tag";

    type $$Props = {
        folder: StorageTreeFolder;
    }

    export let folder: $$Props["folder"];

    $: folderSize = convert(folder.size, "bytes").to("best");
    $: tags = sortTagsByTagCount(folder.tags, folder.tagCount);
</script>

<div on:click on:keydown tabindex="0" class="w-72 h-fit bg-surface-container rounded-2xl p-2 gap-2 flex hover:bg-surface cursor-pointer transition-colors" role="menuitem">
    <div class="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-lg grid place-items-center bg-on-preview">
        <Icon icon={BaselineFolder} class="w-8 h-8 sm:w-12 sm:h-12 text-preview" />
    </div>

    <div class="w-full flex">
        <div class="w-full flex flex-col gap-2">
            <div class="w-full flex flex-col">
                <h3 class="text-primary font-medium text-base sm:text-lg">{folder.name}</h3>
                <span class="text-secondary font-medium text-xss sm:text-xs">
                    {folderSize.quantity.toFixed()} {folderSize.unit}
                    ·
                    {folder.items.length} Files
                </span>
            </div>

            <div class="flex flex-wrap gap-2">
                {#each tags.slice(0, 2) as tag}
                    <span class="bg-secondary select-none rounded-full px-2 text-on-primary font-medium text-xss">{tag.name}</span>
                {/each}
            </div>
        </div>

        <div class="flex-shrink-0">
            <Button type="text" iconType="full">
                <Icon class="text-secondary-container" icon={BaselineMoreVert} />
            </Button>
        </div>
    </div>
</div>
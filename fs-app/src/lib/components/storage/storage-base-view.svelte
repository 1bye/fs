<script lang="ts">
    import type { StorageTreeFile, StorageTreeFolder, BaseTreeStorage } from "$lib/types/storage";
    import { StorageFile, StorageFolder } from "$lib/components/storage";
    import { createEventDispatcher } from "svelte";

    const dispatch = createEventDispatcher<{
        updatePath: {
            folder: StorageTreeFolder;
        };
    }>()

    type $$Props = {
        storage: BaseTreeStorage;
    }

    export let storage: $$Props["storage"];

    function onFileClick(file: StorageTreeFile) {

    }

    function onFolderClick(folder: StorageTreeFolder) {
        dispatch("updatePath", {
            folder
        })
    }

    $: folders = storage.files.filter(_ => _.type === "folder") as StorageTreeFolder[];
    $: files = storage.files.filter(_ => _.type === "file") as StorageTreeFile[];
</script>

<div class="w-full h-fit flex gap-4">
    {#each folders as folder}
        <StorageFolder on:click={() => onFolderClick(folder)} {folder} />
    {/each}

    {#each files as file}
        <StorageFile on:click={() => onFileClick(file)} file={file.data} />
    {/each}
</div>
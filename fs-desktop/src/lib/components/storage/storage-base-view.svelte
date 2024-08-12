<script lang="ts">
    import type { StorageTreeFile, StorageTreeFolder, BaseTreeStorage } from "$lib/types/storage";
    import { StorageFile, StorageFolder } from "$lib/components/storage";
    import { createEventDispatcher } from "svelte";
    import type { Writable } from "svelte/store";
    import type { FileProcessLog } from "$lib/storage/ws/events/file-process";

    const dispatch = createEventDispatcher<{
        updatePath: {
            folder: StorageTreeFolder;
        };
    }>()

    type $$Props = {
        storage: BaseTreeStorage;
        processingFiles: Writable<Record<string, FileProcessLog>>;
    }

    export let storage: $$Props["storage"];
    export let processingFiles: $$Props["processingFiles"];

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
        {@const processing = file.data.id ? !!$processingFiles?.[file?.data?.id] : false}
        <StorageFile {processing} on:click={() => onFileClick(file)} file={file.data} />
    {/each}
</div>
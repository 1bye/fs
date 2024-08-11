<script lang="ts">
    import NavList from "$lib/components/nav/NavList.svelte";
    import { FAB, Dialog, type SnackbarIn, SnackbarAnim } from "m3-svelte";
    import NavListLink from "$lib/components/nav/NavListLink.svelte";
    import BaselineFolderOpenIcon from "@ktibow/iconset-ic/baseline-folder-open"
    import BaselineFolderIcon from "@ktibow/iconset-ic/baseline-folder"
    import BaselineSearchIcon from "@ktibow/iconset-ic/baseline-search"
    import BaselineImageSearchIcon from "@ktibow/iconset-ic/baseline-image-search"
    import BaselinePlusIcon from "@ktibow/iconset-ic/baseline-plus"
    import OutlineCloudUpload from "@ktibow/iconset-ic/outline-cloud-upload"
    import { page } from "$app/stores";
    import { FileUploader } from "$lib/components/storage/file/uploader";

    const paths = [
        {
            path: "/storage",
            icon: BaselineFolderOpenIcon,
            iconS: BaselineFolderIcon,
            label: "All files",
        },
        {
            path: "/storage/search",
            icon: BaselineSearchIcon,
            iconS: BaselineImageSearchIcon,
            label: "Search",
        }
    ];

    let snackbar: (data: SnackbarIn) => void;
    let uploadDialogShown: boolean = false;
    let fileCount: number = 0;

    function normalizePath(path: string) {
        const u = new URL(path, $page.url.href);
        path = u.pathname;
        if (path.endsWith("/")) path = path.slice(0, -1);
        return path || "/";
    }

    function onUploadStart() {
        const message = fileCount > 1 ? `Uploading ${fileCount} files...` : "Uploading file..."

        snackbar({
            message,
            actions: {
                // Undo: () => {}
            },
            closable: true
        })
    }

    function onUploadError() {
        const message = fileCount > 1 ? `Failed upload ${fileCount} files...` : "Failed upload file..."

        snackbar({
            message,
            closable: true
        })

        fileCount = 0;
    }
</script>
{fileCount}
<Dialog extraOptions={{
    class: "[&_.content]:!mb-0"
}} headline="Upload file" icon={OutlineCloudUpload} bind:open={uploadDialogShown}>
    <div class="w-96">
        <FileUploader
                on:uploadStart={onUploadStart}
                on:uploadError={onUploadError}
                on:uploadRevert={() => fileCount++}
                on:removeFile={() => fileCount = Math.min(0, fileCount - 1)}
                on:addFile={() => fileCount++}
        />
    </div>
</Dialog>

<SnackbarAnim bind:show={snackbar} />

<div class="w-full h-full flex">
    <NavList type="rail">
        <div class="flex justify-center">
            <FAB icon={BaselinePlusIcon} on:click={() => uploadDialogShown = true} />
        </div>
        <div class="flex flex-col gap-4">
            {#each paths as { path, icon, iconS, label }}
                {@const selected = normalizePath(path) === normalizePath($page.url.pathname)}
                <NavListLink type="auto" href={path} {selected} icon={selected ? iconS : icon}>
                    {label}
                </NavListLink>
            {/each}
        </div>
        <div></div>
    </NavList>

    <div class="w-full h-full pt-6 pr-6">
        <div class="w-full h-full bg-surface-container rounded-t-4xl">
            <slot />
        </div>
    </div>
</div>
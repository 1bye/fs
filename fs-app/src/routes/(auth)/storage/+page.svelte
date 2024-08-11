<script lang="ts">
    import { StorageBaseView } from "$lib/components/storage";
    import { Button, Icon, Chip } from "m3-svelte";
    import OutlineArrowBack from "@ktibow/iconset-ic/outline-arrow-back";
    import type { StorageFileTag, StorageTreeFolder } from "$lib/types/storage";
    import { writable, type Writable } from "svelte/store";
    import { page } from "$app/stores";
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { unwrapStorageTreeToFolders } from "$lib/utils/storage/tree";

    export let data;

    const path: Writable<StorageTreeFolder[]> = writable([]);
    const query = new URLSearchParams($page.url.searchParams.toString());

    let baseFiles = data.storage.files;
    let currentTags: StorageFileTag[] = [];

    function updatePath({ folder }: {
        folder: StorageTreeFolder
    }) {
        const pathFolder = $path.find(_ => _.path === folder.path);

        if (pathFolder) {
            path.set($path.filter(_ => _.path !== pathFolder.path));
        } else {
            path.set([
                ...$path,
                folder
            ]);
        }

        renderFiles();
    }

    function toStorage() {
        baseFiles = data.storage.files;
        path.set([]);
    }

    function toPath(p: string) {
        const num = p.split("/").filter(Boolean);
        path.set($path.toSpliced(num.length));

        renderFiles();
    }

    function choseTag(tag: StorageFileTag) {
        const index = currentTags.findIndex(_ => _.name === tag.name);

        if (index !== -1) {
            currentTags.splice(index, 1);
        } else {
            currentTags.push(tag);
        }

        currentTags = currentTags;

        renderFiles();
    }

    function renderFiles() {
        const lastFolder = $path.at(-1);
        if (lastFolder)
            baseFiles = lastFolder.items.filter(_ => {
                if (_.type === "folder") return true;

                const tags: StorageFileTag[] = _.data.tags;

                return currentTags.length > 0 ? tags.some(_ => currentTags.findIndex(t => t.name === _.name) !== -1) : true;
            });

        query.set("storage-path", $path.map(_ => _.name).join("/"))
        goto(`/storage?${query}`)
    }

    onMount(() => {
        const storagePath = query.get("storage-path");
        const folders = unwrapStorageTreeToFolders(baseFiles, false);

        if (storagePath) {
            const storagePaths = storagePath.split("/");
            let pathDir: string[] = [];

            for (const sp of storagePaths) {
                pathDir.push(sp);

                const folder = folders.find(_ => _.path === `/${pathDir.join("/")}`);

                path.set([...$path, {
                    path: folder?.path ?? `/${pathDir.join("/")}`,
                    items: folder?.items ?? [],
                    tagCount: folder?.tagCount ?? {},
                    name: folder?.name ?? sp,
                    size: folder?.size ?? 0,
                    tags: folder?.tags ?? [],
                    type: "folder"
                }])
            }

            renderFiles();
        }
    })
</script>

<div class="w-full h-full flex flex-col">
    <div class="w-full h-fit px-4 pt-4">
        <Button type="text" iconType="full">
            <Icon class="text-on-surface" icon={OutlineArrowBack} />
        </Button>
    </div>

    <div class="px-2 pt-4">
        <h1 class="text-on-surface text-xl sm:text-2xl md:text-3xl lg:text-4xl flex items-center">
            <button on:click={toStorage} class="cursor-pointer hover:bg-surface px-4 py-1 rounded-xl">Storage</button>

            {#each $path as p}
                <span class="w-1 flex z-10 -translate-x-1/2">/</span>
                <button on:click={() => toPath(p.path)} class="cursor-pointer hover:bg-surface px-4 py-1 rounded-xl">{p.name}</button>
            {/each}
        </h1>
    </div>

    <div class="w-full px-6 py-4 flex gap-1">
        {#each data.storage.tags as tag}
            {@const selected = !!currentTags.find(_ => _.name === tag.name)}
            <Chip {selected} on:click={() => choseTag(tag)} type="general">
                {tag.name}
            </Chip>
        {/each}
    </div>

    <div class="w-full h-full px-6">
        <StorageBaseView on:updatePath={({ detail }) => updatePath(detail)} storage={{
            tags: data.storage.tags,
            files: baseFiles
        }} />
    </div>
</div>
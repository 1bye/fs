<script lang="ts">
  import { open } from "@tauri-apps/api/dialog";
  import { Button, Chip } from "m3-svelte";
  import { getContext, onMount } from "svelte";
  import { type Writable } from "svelte/store";
  import { copyFile, renameFile, removeFile, createDir } from "@tauri-apps/api/fs";
  import { basename, join, dirname } from "@tauri-apps/api/path";
  import { Store } from "tauri-plugin-store-api";
  import type { Suggestion } from "$lib/types/server";
  import { isPermissionGranted, requestPermission, sendNotification } from "@tauri-apps/api/notification";
  import type { FSStore } from "./store"

  const fsStore = getContext<Writable<FSStore>>("fs_store")

  let currentWatchPath: string | undefined = undefined;
  let permissionGranted = false;

  let tasks = {
    autoTag: true,
    autoMove: true,
    autoRename: true,
  }

  const storeDat = ".data.dat";
  const store = new Store(storeDat);


  async function folderChose() {
    const file = await open({
      // multiple: true,
      directory: true
    });

    if (!file) return;

    const arr = Array.isArray(file) ? file : [file];

    arr.forEach(_ => {
      $fsStore?.fsWatcher?.setPaths(_, true);
      store.set("watch:path", _);

      currentWatchPath = _;
    })

    await store.save();
  }


  onMount(async () => {
    const path = await store.get<string>("watch:path");

    path && $fsStore?.fsWatcher?.setPaths(path, true);

    currentWatchPath = path ?? undefined;

    permissionGranted = await isPermissionGranted();
    if (!permissionGranted) {
      const permission = await requestPermission();
      permissionGranted = permission === "granted";
    }

    if (permissionGranted && path) {
      sendNotification({ title: "Started watching", body: `Started watching following folder: ${path}` });
    }
  })

  async function runSuggestions(suggestions: Suggestion[]) {
    const fsWatcher = $fsStore?.fsWatcher;
    if (!fsWatcher) return;

    fsWatcher.setState("idle");

    for (const suggestion of suggestions) {
      if (suggestion.type === "storage") {
        const from = await join(fsWatcher.getCwd(), suggestion.args.from);
        const to = await join(fsWatcher.getCwd(), suggestion.args.to);

        try {
          await createDir(await dirname(to), {
            recursive: true
          });
        } catch (e) {}

        if (suggestion.task === "moveFile") {
          try {
            await copyFile(from, await join(to, await basename(suggestion.args.from)));
            await removeFile(from)
          } catch (e) {
            console.log(e)
          }
        } else if (suggestion.task === "renameFile") {
          try {
            await renameFile(from, to);
          } catch (e) {
            console.log(e)
          }
        }
      } else if (suggestion.type === "file") {
        if (suggestion.task === "tagFile") {
          console.log(suggestion.args.tags);
        }
      }
    }

    fsWatcher.setState("watch");
    // fsStore.update(value => {
    //   value.suggestions = [];
    //   return value;
    // })
  }
</script>

<div class="w-full">
  <span class="text-base flex font-medium text-secondary pb-2">Tasks</span>
  <div class="w-full h-fit">
    <Chip type="general" selected={tasks.autoTag} on:click={() => tasks.autoTag = !tasks.autoTag}>Auto tag</Chip>
    <Chip type="general" selected={tasks.autoMove} on:click={() => tasks.autoMove = !tasks.autoMove}>Auto move</Chip>
    <Chip type="general" selected={tasks.autoRename} on:click={() => tasks.autoRename = !tasks.autoRename}>Auto rename</Chip>
  </div>

 <div class="w-full h-fit mt-4">
   <Button type={currentWatchPath ? "outlined" : "filled"} on:click={folderChose}>
     Chose directory
   </Button>

   {#if currentWatchPath}
     Watching path: {currentWatchPath}
   {/if}
 </div>

  <div class="w-full flex flex-col gap-2">
    {#if $fsStore.suggestions.length > 0}
      {#each $fsStore.suggestions as suggestion, i}
        <div class="w-full h-fit p-2">
          {i}.
          <span class="text-primary text-xs font-medium">{suggestion.type}</span>
          |
          <span class="text-primary text-xs">{suggestion.task}</span>
          |
          <span class="text-primary text-xs">
            {@html Object.entries(suggestion.args).map(_ => `<b>${_[0]}:</b> ${_[1]}`)}
          </span>
        </div>
      {/each}
      <Button type="filled" on:click={() => runSuggestions($fsStore.suggestions)}>
        Run suggestions
      </Button>
    {/if}
  </div>
</div>


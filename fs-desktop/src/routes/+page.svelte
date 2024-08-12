<script lang="ts">
  import { open } from "@tauri-apps/api/dialog";
  import { Button } from "m3-svelte";
  import { FSWatcher } from "$lib/watch";
  import { onMount } from "svelte";
  import { PUBLIC_WS_SERVER_URL, PUBLIC_SERVER_URL, PUBLIC_DOMAIN } from "$env/static/public";
  import { invalidate } from "$app/navigation";
  import { writable, type Writable } from "svelte/store";
  import { type FileProcessLog, WSEventFileProcess } from "$lib/storage/ws/events/file-process";
  import { WSReader } from "$lib/utils/ws/reader";
  import { readBinaryFile, copyFile, renameFile, removeFile, createDir } from "@tauri-apps/api/fs";
  import { basename, join, dirname } from "@tauri-apps/api/path";
  import { Command } from "@tauri-apps/api/shell";
  import { type } from "@tauri-apps/api/os";
  import { Store } from "tauri-plugin-store-api";
  import type { ServerBaseResponse, Suggestion } from "$lib/types/server";
  import { isPermissionGranted, requestPermission, sendNotification } from "@tauri-apps/api/notification";

  let currentWatchPath: string | undefined = undefined;
  let suggestions: Suggestion[] = [];
  let permissionGranted = false;

  const storeDat = ".data.dat";
  const store = new Store(storeDat);

  const processingFiles: Writable<Record<string, FileProcessLog>> = writable({});

  const fsWatcher = new FSWatcher({
    recursive: true,
    callbacks: {
      async onFileAdded(params) {
        console.log("File added", params)
        const fileName = await basename(params.path);
        sendNotification(`Generating suggestions on file ${fileName}`);

        const [binFile, tree] = await Promise.all([
          readBinaryFile(params.path),
          getTree(params.cwd)
        ]);
        const file = new File([binFile], fileName);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("tree", tree);
        formData.append("tasks", "autoTag, autoMove, autoRename");

        const res = await fetch(`${PUBLIC_SERVER_URL}/v1/file-d/analyze`, {
          method: "POST",
          body: formData,
          headers: {
            "Origin": PUBLIC_DOMAIN
          }
        });

        if (!res.ok) {
          console.log(res.status, res.statusText, await res.text())
          return;
        }

        const data = await res.json() as ServerBaseResponse<{
          suggestions: Suggestion[];
        }>;

        console.log(data)
        sendNotification(`Chose suggestions of file ${fileName} in app`);
        suggestions = data.data.suggestions;
      },
      onFileMove(params) {
        console.log("File moved", params)
      },
      onFileRemove(params) {
        console.log("File removed", params);
      },
      onFileRename(params) {
        console.log("File renamed", params)
      }
    }
  })

  async function getTree(path: string) {
    try {
      const osType = await type();
      const args = osType === "Windows_NT" ? [] : ["-a"];

      const command = new Command("tree", args, {
        cwd: path
      });

      const data = await command.execute();
      console.log(data)
      return data.stdout;
    } catch (e) {
      console.log(e)
      return "";
    }
  }

  async function folderChose() {
    const file = await open({
      // multiple: true,
      directory: true
    });

    if (!file) return;

    const arr = Array.isArray(file) ? file : [file];

    arr.forEach(_ => {
      fsWatcher.setPaths(_, true);
      store.set("watch:path", _);

      currentWatchPath = _;
    })

    await store.save();
  }

  async function connect() {
    const ws = new WebSocket(`${PUBLIC_WS_SERVER_URL}/v1/file-d/processing`);

    const reader = new WSReader(ws, [
      new WSEventFileProcess(logs => {
        for (const log of Object.values(logs)) {
          if (log.process !== "starting") {
            processingFiles.update(value => {
              value[log.fileId] = log;

              return value;
            })

            console.log($processingFiles)

            invalidate("storage:refresh");
          }
        }
      })
    ]);

    reader.start({
      open() {
        console.log("Opened")
      },
      close() {
        console.log("Closed")
      }
    })
  }

  onMount(async () => {
    const path = await store.get<string>("watch:path");

    path && fsWatcher.setPaths(path, true);

    currentWatchPath = path ?? undefined;

    permissionGranted = await isPermissionGranted();
    if (!permissionGranted) {
      const permission = await requestPermission();
      permissionGranted = permission === "granted";
    }

    if (permissionGranted && path) {
      sendNotification({ title: "Started watching", body: `Started watching following folder: ${path}` });
    }

    connect();

    return () => {
      fsWatcher.destroy();
    }
  })

  async function runSuggestions(suggestions: Suggestion[]) {
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
  }
</script>

<Button type="filled" on:click={folderChose}>
  Chose directories
</Button>

{#if currentWatchPath}
  Watching path: {currentWatchPath}
{/if}

<div class="w-full flex flex-col gap-2">
  {#if suggestions.length > 0}
    <Button type="text" on:click={() => runSuggestions(suggestions)}>
      Run suggestions
    </Button>
  {/if}
</div>
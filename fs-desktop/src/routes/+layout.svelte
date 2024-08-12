<script lang="ts">
    import { StyleFromScheme } from "m3-svelte";
    import "../app.css";
    import { FSWatcher } from "$lib/watch"
    import { basename } from "@tauri-apps/api/path"
    import { sendNotification } from "@tauri-apps/api/notification"
    import { readBinaryFile } from "@tauri-apps/api/fs"
    import { PUBLIC_DOMAIN, PUBLIC_SERVER_URL, PUBLIC_WS_SERVER_URL } from "$env/static/public"
    import type { ServerBaseResponse, Suggestion } from "$lib/types/server"
    import { Command } from "@tauri-apps/api/shell"
    import { onMount, setContext } from "svelte"
    import { createFSStore } from "./store"
    import { type } from "@tauri-apps/api/os";
    import { WSReader } from "$lib/utils/ws/reader"
    import { WSEventFileProcess } from "$lib/storage/ws/events/file-process"
    import { invalidate } from "$app/navigation"
    import NavList from "$lib/components/nav/NavList.svelte"
    import NavListLink from "$lib/components/nav/NavListLink.svelte"
    import { page } from "$app/stores"
    import OutlineSignalWifi from "@ktibow/iconset-ic/outline-signal-wifi-0-bar"
    import OutlineSignalWifiFull from "@ktibow/iconset-ic/outline-signal-wifi-4-bar"
    import BaselineShowChart from "@ktibow/iconset-ic/baseline-show-chart"
    import BaselineSsidChart from "@ktibow/iconset-ic/baseline-ssid-chart"

    const fsStore = setContext("fs_store", createFSStore({}));
    const paths = [
        {
            path: "/",
            icon: OutlineSignalWifi,
            iconS: OutlineSignalWifiFull,
            label: "Home",
        },
        {
            path: "/logs",
            icon: BaselineShowChart,
            iconS: BaselineSsidChart,
            label: "Logs",
        }
    ];

    const fsWatcher = new FSWatcher({
        recursive: true,
        callbacks: {
            async onFileAdded(params) {
                try {
                    console.log("File added", params)

                    fsStore.update(value => {
                        value.logs.push({
                            event: "add",
                            paths: [params.path],
                            type: "storage",
                            ts: Date.now()
                        })
                        return value;
                    })

                    const fileName = await basename(params.path);
                    sendNotification(`Generating suggestions on file ${fileName}`);

                    const [binFile, tree] = await Promise.all([
                        readBinaryFile(params.path),
                        getTree(params.cwd)
                    ]);
                    const file = new File([binFile], fileName);

                    const formData = new FormData();
                    formData.append("file", file);
                    formData.append("tree", tree ?? "s");
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
                    fsStore.update(value => {
                        value["suggestions"] = data.data.suggestions
                        return value;
                    })
                } catch (e) {
                    fsStore.update(value => {
                        value.logs.push({
                            event: "error",
                            error: e as Error,
                            type: "app",
                            ts: Date.now()
                        })
                        return value;
                    })
                }
            },
            onFileMove(params) {
                console.log("File moved", params);
                fsStore.update(value => {
                    value.logs.push({
                        event: "move",
                        paths: params.paths,
                        type: "storage",
                        ts: Date.now()
                    })
                    return value;
                })
            },
            onFileRemove(params) {
                console.log("File removed", params);
                fsStore.update(value => {
                    value.logs.push({
                        event: "delete",
                        paths: [params.path],
                        type: "storage",
                        ts: Date.now()
                    })
                    return value;
                })
            },
            onFileRename(params) {
                console.log("File renamed", params)
                fsStore.update(value => {
                    value.logs.push({
                        event: "rename",
                        paths: params.paths,
                        type: "storage",
                        ts: Date.now()
                    })
                    return value;
                })
            }
        }
    });

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
            fsStore.update(value => {
                value.logs.push({
                    event: "error",
                    error: e as Error,
                    type: "app",
                    ts: Date.now()
                })
                return value;
            })
            return "";
        }
    }

    async function connect() {
        try {
            const ws = new WebSocket(`${PUBLIC_WS_SERVER_URL}/v1/file-d/processing`);

            const reader = new WSReader(ws, [
                new WSEventFileProcess(logs => {
                    for (const log of Object.values(logs)) {
                        if (log.process !== "starting") {
                            fsStore.update(value => {
                                value["fileProcessLogs"][log.fileId] = log;
                                return value;
                            })

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
        } catch (e) {
            fsStore.update(value => {
                value.logs.push({
                    event: "error",
                    error: e as Error,
                    type: "app",
                    ts: Date.now()
                })
                return value;
            })
        }
    }

    onMount(() => {
        fsStore.update(value => {
            value["fsWatcher"] = fsWatcher;
            return value;
        });

        connect();

        return () => {
            fsWatcher.destroy();
        }
    })

    function normalizePath(path: string) {
        const u = new URL(path, $page.url.href);
        path = u.pathname;
        if (path.endsWith("/")) path = path.slice(0, -1);
        return path || "/";
    }
</script>

<StyleFromScheme
        lightScheme={{"primary":4284503952,"onPrimary":4294967295,"primaryContainer":4293254911,"onPrimaryContainer":4282924919,"inversePrimary":4291411711,"secondary":4284505201,"onSecondary":4294967295,"secondaryContainer":4293255161,"onSecondaryContainer":4282926169,"tertiary":4286337636,"onTertiary":4294967295,"tertiaryContainer":4294957286,"onTertiaryContainer":4284627788,"error":4290386458,"onError":4294967295,"errorContainer":4294957782,"onErrorContainer":4287823882,"background":4294834431,"onBackground":4280032032,"surface":4294834431,"onSurface":4280032032,"surfaceVariant":4293255404,"onSurfaceVariant":4282926414,"inverseSurface":4281413430,"inverseOnSurface":4294242295,"outline":4286150015,"outlineVariant":4291413456,"shadow":4278190080,"scrim":4278190080,"surfaceDim":4292729056,"surfaceBright":4294834431,"surfaceContainerLowest":4294967295,"surfaceContainerLow":4294439674,"surfaceContainer":4294044916,"surfaceContainerHigh":4293650158,"surfaceContainerHighest":4293255657,"surfaceTint":4284503952}}
        darkScheme={{"primary":4291411711,"onPrimary":4281411679,"primaryContainer":4282924919,"onPrimaryContainer":4293254911,"inversePrimary":4284503952,"secondary":4291412956,"onSecondary":4281413185,"secondaryContainer":4282926169,"onSecondaryContainer":4293255161,"tertiary":4293769421,"onTertiary":4282918197,"tertiaryContainer":4284627788,"onTertiaryContainer":4294957286,"error":4294948011,"onError":4285071365,"errorContainer":4287823882,"onErrorContainer":4294957782,"background":4279505688,"onBackground":4293255657,"surface":4279505688,"onSurface":4293255657,"surfaceVariant":4282926414,"onSurfaceVariant":4291413456,"inverseSurface":4293255657,"inverseOnSurface":4281413430,"outline":4287860633,"outlineVariant":4282926414,"shadow":4278190080,"scrim":4278190080,"surfaceDim":4279505688,"surfaceBright":4282005566,"surfaceContainerLowest":4279110931,"surfaceContainerLow":4280032032,"surfaceContainer":4280295205,"surfaceContainerHigh":4281018671,"surfaceContainerHighest":4281742394,"surfaceTint":4291411711}} />



<main class="w-full h-screen">
    <div class="w-full h-full flex">
        <NavList type="rail">
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

        <div class="w-full h-full p-4 pl-0 bg-surface">
            <div class="w-full h-full bg-surface-container-lowest rounded-3xl p-4">
                <slot />
            </div>
        </div>
    </div>
</main>

import { watchImmediate, type RawEvent } from "tauri-plugin-fs-watch-api";
import { type, type OsType } from "@tauri-apps/api/os";

type DestroyFn = () => void;

type LinuxEventType = {
    modify?: {
        kind: string | "metadata";
        mode: "both" | "from" | "to" | "any"
    },
    create?: {
        kind: "file" | "folder"
    },
    access?: {
        kind: "close",
        mode: "write"
    }
};

type WindowsEventType = {
    modify?: {
        kind: string | "rename";
        mode: "both" | "from" | "to" | "any"
    },
    create?: {
        kind: "any"
    },
    remove?: {
        kind: "any"
    }
};

export interface FSWatcherCallbackParams {
    cwd: string;
}

export interface FSWatcherCallbacks {
    onFileAdded?(params: FSWatcherCallbackParams & {
        path: string;
    }): void;

    onFileMove?(params: FSWatcherCallbackParams & {
        paths: string[];
    }): void;

    onFileRemove?(params: FSWatcherCallbackParams & {
        path: string;
    }): void;

    onFileRename?(params: FSWatcherCallbackParams & {
        paths: string[];
    }): void;
}

export type FSWatcherState = "watch" | "idle";

export interface IFSWatcher {
    recursive?: boolean;
    path: string;
    destroyFn: DestroyFn | undefined;
    callbacks?: FSWatcherCallbacks;
    osType?: OsType;

    state: FSWatcherState;

    eventStack: RawEvent[];

    setPaths(path: string, refresh?: boolean): void;
    processEvent(event: RawEvent): void;
    setState(state: FSWatcherState): void;
    resolveStack(cb: () => Promise<boolean> | boolean, ms: number): Promise<void>;
    getCwd(): string;

    start(): void;
    destroy(): void;
}

export interface FSWatcherConstructor {
    path?: string;
    recursive?: boolean;

    callbacks?: FSWatcherCallbacks;
}

export class FSWatcher implements IFSWatcher {
    path: string;
    destroyFn: DestroyFn | undefined;
    recursive: boolean = true;
    callbacks: FSWatcherCallbacks | undefined;
    osType: OsType | undefined;

    state: FSWatcherState = "watch";

    eventStack: RawEvent[] = [];

    constructor(params: FSWatcherConstructor) {
        this.path = params.path ?? "";
        this.recursive = params.recursive ?? true;
        this.callbacks = params.callbacks;
    }

    setPaths(path: string, refresh?: boolean) {
        console.log("Set path", path, refresh);
        this.path = path;

        if (refresh) {
            this.destroyFn && this.destroy();
            this.start();
        }
    }

    async start() {
        this.osType = this.osType ?? await type();

        this.destroyFn = await watchImmediate(this.path, event => {
            if (this.state === "watch")
                this.processEvent(event);
        }, {
            recursive: this.recursive
        });
    }

    setState(state: FSWatcherState) {
        this.state = state;
    }

    processEvent(event: RawEvent): void {
        this.eventStack.push(event);
        console.log(event)
        if (this.osType === "Linux") {
            this.linuxProcessEvent(event);
        } else if (this.osType === "Windows_NT") {
            this.windowsProcessEvent(event)
        } {
            this.defaultProcessEvent(event);
        }
    }

    windowsProcessEvent(event: RawEvent): void {
        const type = event.type as WindowsEventType | undefined;
        if (!type) return;

        if (type?.remove) {
            const file1 = event.paths[0];

            this.resolveStack(() => {
                const type = (this.eventStack?.at(-1)?.type as WindowsEventType | undefined);

                if (!type) {
                    return false;
                }

                return type.create?.kind === "any" || type?.modify?.kind === "any";
            }, 10)
                .then(_ => {
                    const paths = (this.eventStack?.at(-1)?.paths as string[] | undefined);

                    this.callbacks?.onFileMove?.({
                        cwd: this.path,
                        paths: [file1, paths?.[0] ?? ""]
                    })
                })
                .catch(() => {
                    this.callbacks?.onFileRemove?.({
                        path: file1,
                        cwd: this.path
                    })
                });

        } else if (type?.modify) {
            if (type.modify.kind === "rename" && type.modify.mode === "from") {
                const file1 = event.paths[0];

                this.resolveStack(() => {
                    const type = (this.eventStack?.at(-1)?.type as WindowsEventType | undefined);

                    if (!type) {
                        return false;
                    }

                    return type.modify?.kind === "rename" && type?.modify.mode === "to"
                }, 10)
                    .then(_ => {
                        const paths = (this.eventStack?.at(-1)?.paths as string[] | undefined);

                        this.callbacks?.onFileRename?.({
                            cwd: this.path,
                            paths: [file1, paths?.[0] ?? ""]
                        })
                    })
                    .catch();
            }
        } else if (type.create) {
            this.callbacks?.onFileAdded?.({
                cwd: this.path,
                path: event.paths[0]
            })
        }
    }

    defaultProcessEvent(event: RawEvent): void {

    }

    linuxProcessEvent(event: RawEvent): void {
        const type = event.type as LinuxEventType | undefined;

        if (!type) return;

        if (type?.modify && type?.modify.mode === "both") {
            const [path1, path2] = event.paths;

            const path1Segments = path1.split("/").filter(Boolean);
            const path2Segments = path2.split("/").filter(Boolean);

            const path1FileName = path1Segments.at(-1);
            const path2FileName = path2Segments.at(-1);

            const sameDir = path1Segments.length === path2Segments.length;

            if (!sameDir) {
                this.callbacks?.onFileMove?.({
                    paths: [path1, path2],
                    cwd: this.path
                });
            }

            if (path1FileName && path2FileName) {
                path1FileName.trim() !== path2FileName.trim()
                    && this.callbacks?.onFileRename?.({
                        paths: [path1, path2],
                        cwd: this.path
                    });
            }
        } else if (type?.modify && type?.modify.mode === "from") {
            if (event.paths.length === 1) {
                this.resolveStack(() => {
                    const type = (this.eventStack?.at(-1)?.type as LinuxEventType | undefined);

                    if (!type) {
                        return false;
                    }

                    return !(
                        type?.modify && (type?.modify.mode === "both" || type?.modify?.mode === "to")
                    );
                }, 10)
                    .then(_ => this.callbacks?.onFileRemove?.({
                        cwd: this.path,
                        path: event.paths[0] as string
                    }))
                    .catch();
            }

        }

        if (type?.create && type?.create?.kind === "file") {
            this.callbacks?.onFileAdded?.({
                path: event.paths[0] as string,
                cwd: this.path
            })
        }
    }

    getCwd(): string {
        return this.path;
    }

    async resolveStack(cb: () => Promise<boolean> | boolean, ms: number = 10) {
        await new Promise<void>(async (resolve, reject) => {
            await new Promise(res => setTimeout(res, ms));

            try {
                const val = await cb?.();

                val ? resolve() : reject();
            } catch (e) {
                reject(e);
            }
        })
    }

    destroy() {
        this.destroyFn?.();
    }
}
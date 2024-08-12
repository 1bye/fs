<script lang="ts">
    import { PUBLIC_SERVER_URL } from "$env/static/public"
    import { Button } from "m3-svelte";
    import { open } from "@tauri-apps/plugin-dialog";
    import { watch } from "@tauri-apps/plugin-fs";
    import { onMount } from "svelte";

    let unwatchFn: (() => void) | undefined = undefined;

    async function choseDirectories() {
        const file = await open({
            multiple: true,
            directory: true,
        });

        if (!file) return;
        console.log(file)
        unwatchFn = await watch(file, (event) => {
            console.log(event)
        }, {
            recursive: true,
            baseDir: "/cd ."
        })

        console.log(file)
    }

    onMount(() => {

        return () => {
            unwatchFn?.();
        };
    })
</script>

<Button type="filled" on:click={choseDirectories}>
    Choose directories
</Button>

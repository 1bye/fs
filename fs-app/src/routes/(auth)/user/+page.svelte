<script lang="ts">
    import * as FilePond from "filepond";
    import "filepond/dist/filepond.css"
    import { onMount } from "svelte";
    import { PUBLIC_SERVER_URL } from "$env/static/public";
    import { Snackbar } from "m3-svelte";

    export let data;

    let uploadContainer: HTMLElement;

    onMount(() => {
        const pond = FilePond.create(uploadContainer, {
            name: "filepond",
            allowMultiple: true,
            credits: false,
            server: {
                // url: `${PUBLIC_SERVER_URL}/v1/storage/upload`,
                process: {
                    url: `${PUBLIC_SERVER_URL}/v1/storage/upload`,
                    withCredentials: true
                }
            },
            allowRevert: false,

        });

        return () => {
            pond.destroy();
        }
    })
</script>

<Snackbar show={(message) => {
    console.log(message)
}} />

<div bind:this={uploadContainer}>

</div>


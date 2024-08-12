<script lang="ts">
    import { PUBLIC_SERVER_URL } from "$env/static/public";
    import { createEventDispatcher, onMount } from "svelte";
    import * as FilePond from "filepond";
    import "./style.css";
    import "./override.css";

    const dispatch = createEventDispatcher<{
        uploadStart: FilePond.FilePondFile;
        uploadError: {
            error: FilePond.FilePondErrorDescription;
            file?: FilePond.FilePondFile;
        };
        uploadRevert: FilePond.FilePondFile;

        removeFile: FilePond.FilePondFile;
        addFile: FilePond.FilePondFile;
    }>();

    let uploadContainer: HTMLElement;

    onMount(() => {
        const pond = FilePond.create(uploadContainer, {
            name: "filepond",
            allowMultiple: true,
            credits: false,
            server: {
                // url: `${PUBLIC_SERVER_URL}/v1/storage/upload`,
                process: {
                    url: `${PUBLIC_SERVER_URL}/v1/storage/upload123132`,
                    withCredentials: true
                }
            },
            allowRevert: false,
            maxFiles: 25,
            onaddfile(error, file) {
                if (error) dispatch("uploadError", {
                    error,
                    file
                })
                else dispatch("addFile", file);
            },
            onaddfilestart(file) {
                dispatch("uploadStart", file);
            },
            onremovefile(error, file) {
                if (error) dispatch("uploadError", {
                    error,
                    file
                })
                else dispatch("removeFile", file);
            },
            onprocessfilerevert(file) {
                dispatch("uploadRevert", file);
            },
            onprocessfile(error, file) {
                if (error) dispatch("uploadError", {
                    error,
                    file
                })
            }
        });

        return () => {
            pond.destroy();
        }
    })
</script>

<div bind:this={uploadContainer}></div>


<script lang="ts">
    import { onMount } from "svelte";
    import LoadingAnimationData from "./loading-anim.json";
    import lottie from "lottie-web";

    export let width: number = 24;
    export let height: number = 24;

    let containerEl: HTMLElement;

    onMount(() => {
        const animation = lottie.loadAnimation({
            autoplay: true,
            loop: true,
            renderer: "svg",
            container: containerEl,
            animationData: LoadingAnimationData
        });

        return () => animation.destroy();
    })
</script>

<div data-loading bind:this={containerEl} style="width: {width}px; height: {height}px;"></div>

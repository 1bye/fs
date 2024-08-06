<script lang="ts">
    import { PUBLIC_SERVER_URL } from "$env/static/public"
    import { ButtonLink } from "m3-svelte";
</script>

<ButtonLink href="{PUBLIC_SERVER_URL}/v1/auth/github" type="filled">
    Github
</ButtonLink>
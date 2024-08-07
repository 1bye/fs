import { jsonError } from "@app/server/response/error";
import { handleSession } from "@app/server/session";
import { json } from "@app/server/response";
import { supabase } from "@apps/supabase";
import { Elysia, t } from "elysia";
import serverConfig from "@config/server.config";
import authConfig from "@config/auth.config";
import clientConfig from "@config/client.config";

export default new Elysia({ prefix: "/auth" })
    .get("/refresh-token", async (ctx) => {
        console.log("REFRESH SESSION")
        await handleSession(ctx)
        return json("Successfully refreshed token");
    })

    .get("/github", async () => {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: "github",
            options: {
                redirectTo: `${serverConfig.baseURL}/v1/auth/github/callback`,
            }
        });

        console.log(serverConfig, process.env)

        if (!data.url) {
            throw jsonError(new Error("Failed to authenticate with github"));
        }

        if (error) {
            throw jsonError(error);
        }

        return Response.redirect(data.url);
    })

    .get("/github/callback", async ({ query: { code }, cookie }) => {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (!data.user || !data.session) {
            throw jsonError(new Error("Failed to authenticate with github"));
        }

        if (error) {
            throw jsonError(error);
        }

        cookie[authConfig.accessTokenCookieName].set({
            httpOnly: true,
            secure: serverConfig.production,
            value: data.session.access_token,
            maxAge: data.session?.expires_in ?? 3600,
        });

        cookie[authConfig.refreshTokenCookieName].set({
            httpOnly: true,
            secure: serverConfig.production,
            value: data.session.refresh_token,
            maxAge: authConfig.refreshTokenExpiresAfter
        });

        return Response.redirect(clientConfig.authRedirectURL)
    }, {
        query: t.Object({
            code: t.String()
        })
    })
import { cors } from "@elysiajs/cors"
import { Elysia } from "elysia";
import v1 from "@app/routes/v1";
import serverConfig from "@config/server.config";
import { ERRORS, handleErrors } from "@app/server/response/error";

const app = new Elysia()
    .onError(handleErrors)
    .error(ERRORS)

    .use(
        cors({
            methods: "*",
            // origin: serverConfig.allowedOrigins,
            origin: true
        })
    )
    .use(v1)

    .listen(3000);

console.log(
    `📁 FS server is running at ${app.server?.hostname}:${app.server?.port} :)`
);

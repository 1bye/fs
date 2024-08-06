import { cors } from "@elysiajs/cors"
import { Elysia } from "elysia";
import v1 from "@app/routes/v1";

const app = new Elysia()
    .use(
        cors({
            methods: "*",
            origin: "localhost"
        })
    )
    .use(v1)

    .listen(3000);

console.log(
    `📁 FS server is running at ${app.server?.hostname}:${app.server?.port}`
);

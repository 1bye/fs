import { Elysia } from "elysia";
import { handleSession } from "@app/server/session";

export default new Elysia({ prefix: "/user" })
    .derive({ as: "local" }, handleSession)
    .get("/", ({ user }) => {
        return user;
    })
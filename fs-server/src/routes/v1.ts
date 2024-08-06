import { Elysia } from "elysia";
import auth from "./auth";
import file from "./file";
import user from "./user";
import storage from "./storage";

export default new Elysia({ prefix: "/v1" })
    .use(auth)
    .use(file)
    .use(user)
    .use(storage)
    .get("/health", () => "Everything is OK")

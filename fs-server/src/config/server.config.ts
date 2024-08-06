import { ServerConfig } from "@config/types/server";
import * as process from "node:process";
import { env } from "@utils/env";

export default {
    tmpFolder: `${process.cwd()}/tmp`,

    production: process.env.NODE_ENV === "production",

    baseURL: env("SERVER_BASE_URL")
} as ServerConfig;
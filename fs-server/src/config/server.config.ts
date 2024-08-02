import { ServerConfig } from "@config/types/server";
import * as process from "node:process";

export default {
    tmpFolder: `${process.cwd()}/tmp`,

    production: process.env.NODE_ENV === "production"
} as ServerConfig;
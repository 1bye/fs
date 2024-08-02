import { ServerConfig } from "@config/types/server";
import * as process from "node:process";

export default {
    tmpFolder: `${process.cwd()}/tmp`
} as ServerConfig;
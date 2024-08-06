import { DBConfig } from "@config/types/db";
import { env } from "@utils/env";

export default {
    url: env("DATABASE_URL")
} as DBConfig;
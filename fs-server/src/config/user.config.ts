import { UserConfig } from "@config/types/user";
import { env } from "@utils/env";

export default {
    fileBucket: env("USER_BUCKET")
} as UserConfig;
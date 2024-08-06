import { UserConfig } from "@config/types/user";
import { env } from "@utils/env";

export default {
    fileBucket: env("USER_BUCKET"),
    tmpFileBucket: env("USER_BUCKET_TMP"),
} as UserConfig;
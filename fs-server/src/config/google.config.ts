import { GoogleConfig } from "@config/types/google";
import { env } from "@utils/env";

export default {
    projectId: env("GC_PROJECT_ID"),
    genAI: {
        apiKey: env("GC_API_KEY"),
    }
} as GoogleConfig;
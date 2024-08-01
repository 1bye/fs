import { GoogleConfig } from "@config/types/google";
import { env } from "@utils/env";

export default {
    projectId: env("GOOGLE_PROJECT_ID"),
    genAI: {
        apiKey: env("GOOGLE_API_KEY"),
    }
} as GoogleConfig;
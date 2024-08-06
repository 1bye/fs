import { ClientConfig } from "@config/types/client";
import { env } from "@utils/env";

const baseURL = env("CLIENT_BASE_URL");

export default {
    baseURL,
    authRedirectURL: `${baseURL}/user`,
} as ClientConfig
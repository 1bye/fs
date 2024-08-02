import { t } from "elysia";

/**
 * Sign in/up model with email and password
 */

export const SignDTOModel = t.Object({
    email: t.String({
        format: "email",
    }),
    password: t.String(),
})
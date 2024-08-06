import { defineConfig } from "drizzle-kit";
import dbConfig from "@config/db.config";

export default defineConfig({
    schema: "./src/apps/drizzle/schema.ts",
    out: "./src/apps/drizzle/migrations",
    dialect: "postgresql",
    dbCredentials: {
        url: dbConfig.url
    }
});
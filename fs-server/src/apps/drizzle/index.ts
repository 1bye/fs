import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import dbConfig from "@config/db.config";

const client = postgres(dbConfig.url, {
});
const db = drizzle(client);

export {
    db,
    client
};
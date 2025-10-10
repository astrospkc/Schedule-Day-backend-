import "dotenv/config";
import dotenv from "dotenv";
const env = process.env.NODE_ENV || 'local';
dotenv.config({ path: `.env.${env}` });
// Ensure DB_CONNECTION_URL is defined
if (!process.env.DB_CONNECTION_URL) {
    throw new Error('DB_CONNECTION_URL is not defined in environment variables');
}
const knexConfig = {
    client: "pg",
    connection: process.env.DB_CONNECTION_URL,
    migrations: {
        directory: "./migrations",
        extension: "ts",
    },
    // searchPath: ["knex", "public"],
};
export default knexConfig;
//# sourceMappingURL=knexfile.js.map
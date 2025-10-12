import "dotenv/config";
import dotenv from "dotenv";
import type { Knex } from "knex";
dotenv.config();

// Ensure DB_CONNECTION_URL is defined
if (!process.env.DB_CONNECTION_URL) {
  throw new Error('DB_CONNECTION_URL is not defined in environment variables');
}

const knexConfig: Knex.Config = {
  client: "pg",
  connection: process.env.DB_CONNECTION_URL,
  migrations: {
    directory: "./migrations",
    extension: "ts",
  },
  // searchPath: ["knex", "public"],
};

export default knexConfig;
import "dotenv/config";
import dotenv from "dotenv";
const env = process.env.NODE_ENV || 'local'

dotenv.config({ path: `.env.${env}` });

const knexConfig = {
  client: "pg",
  connection: process.env.DB_CONNECTION_URL || undefined,
  migrations: {
    directory: "./migrations",
    extension: "ts",
  },
  //   searchPath: ["knex", "public"],
};

export default knexConfig;

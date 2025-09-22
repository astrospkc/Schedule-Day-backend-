import "dotenv/config";

const knexConfig = {
  client: "pg",
  connection: process.env.DB_CONNECTION_URL || {
    host: process.env.PG_HOST || "127.0.0.1",
    port: +(process.env.PG_PORT || 5432),
    user: process.env.PG_USER || "postgres",
    password: process.env.PG_PASSWORD || "postgres",
    database: process.env.PG_DATABASE || "mydb",
  },
  migrations: {
    directory: "./migrations",
    extension: "ts",
  },
  //   searchPath: ["knex", "public"],
};

export default knexConfig;

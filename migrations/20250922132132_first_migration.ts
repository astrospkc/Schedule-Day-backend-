import type { Knex } from "knex";
import dbClient from "../src/db/index.ts";


export async function up(knex: Knex): Promise<void> {
    return dbClient.schema
        .createTable("users", function (table) {
            table.increments();
            table.string("name")
            table.string("email")
            table.string("password")
            table.timestamps();
        })
        .createTable("tasks", function (table) {
            table.increments();
            table.string("title");
            table.string("status");
            table.dateTime("start_date");
            table.dateTime("end_date");
            table.integer("user_id").references("id").inTable("users");
            table.boolean("is_recurring").defaultTo(false)
            table.dateTime("next_execution_time")
            table.timestamps();
        })
        .createTable("task_history", function (table) {
            table.increments();
            table.integer("task_id").references("id").inTable("tasks");
            table.string("status")
        })
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable('products').dropTable('users');
}




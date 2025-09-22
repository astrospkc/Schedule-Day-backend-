import knex from "knex";
import knexConfig from '../../knexfile.ts'

const dbClient = knex(knexConfig)
export default dbClient
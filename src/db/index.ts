import knex from "knex";
import knexConfig from '../../knexfile.js'

const dbClient = knex(knexConfig)
export default dbClient 
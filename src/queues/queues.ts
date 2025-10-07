import { Queue } from "bullmq"
import redisConnection from "../db/redisConnection.ts"
export const emailQueue = new Queue("emailQueue", { connection: redisConnection })
export const welcomeEmailQueue = new Queue("welcomeEmailQueue", { connection: redisConnection })
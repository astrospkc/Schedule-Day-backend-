import { Queue } from "bullmq";
import redisConnection from "../db/redisConnection.js";
export const emailQueue = new Queue("emailQueue", { connection: redisConnection });
export const welcomeEmailQueue = new Queue("welcomeEmailQueue", { connection: redisConnection });
//# sourceMappingURL=queues.js.map
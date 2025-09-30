// import { emailQueue } from './../queues.ts';
import { Worker } from 'bullmq';
import redisConnection from '../../db/redisConnection.ts';
// import dbClient from '../../db/index.ts';

// Create a new connection in every instance
const worker = new Worker(
    "emailQueue",
    async (job) => {
        // console.log(job)
        console.log(`Sending email to ${job.data.email}`)
        console.log(" job id: ", job.data.jobId, typeof job.data.jobId)

        // const jobDoc = await dbClient.select("*").from("tasks").where({ id: job.data.jobId });
        // if (jobDoc.length < 0) return
        // if (jobDoc[0].is_recurring) {
        //     // then no next_execution_time
        // } else {

        // }
        // console.log(" job doc: ", jobDoc)
        // if (jobDoc) {
        //     jobDoc.status = "completed";
        //     jobDoc.next_execution_time = new Date();
        //     await jobDoc.save();
        // }
    },
    {
        connection: redisConnection
    }
)

worker.on("completed", (job) => {
    console.log(`✅ Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
    console.error(`❌ Job ${job?.id} failed`, err);
});
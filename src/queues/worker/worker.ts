// import { emailQueue } from './../queues.ts';
import { Worker } from 'bullmq';
import redisConnection from '../../db/redisConnection.ts';
import dbClient from '../../db/index.ts';
import { emailQueue } from '../queues.ts';
import { welcomeEmailWorkerInstance } from './welcomeEmailWorker.js';
// import dbClient from '../../db/index.ts';

// Create a new connection in every instance
const worker = new Worker(
    "emailQueue",
    async (job) => {
        console.log(`Processing email job for ${job.data.email}`);
        console.log("Job ID:", job.data.jobId, "Task History ID:", job.data.taskHistoryId);

        try {
            // Update THIS execution's task_history record as completed
            if (job.data.taskHistoryId) {
                await dbClient("task_history")
                    .where({ id: job.data.taskHistoryId })
                    .update({
                        status: "completed",
                    });
                console.log(`✅ Marked task_history ${job.data.taskHistoryId} as completed`);
            }

            // Send email (your actual work)
            console.log(`📧 Sending email to ${job.data.email}`);
            // await sendEmail(job.data.email, ...);

            // Fetch task details
            const jobDoc = await dbClient
                .select("*")
                .from("tasks")
                .where({ id: job.data.jobId });

            if (jobDoc.length === 0) {
                console.log("⚠️ Task not found");
                return;
            }

            const task = jobDoc[0];

            // Handle recurring tasks
            if (task.is_recurring) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const endDate = new Date(task.end_date);
                endDate.setHours(0, 0, 0, 0);

                // Check if we've reached the end date
                if (endDate <= today) {  // Use < if you want tasks to run ON end date
                    await dbClient("tasks")
                        .where({ id: job.data.jobId })
                        .update({ status: "not active" });
                    console.log("🏁 Recurring task completed - reached end date");
                    return;
                }

                // Calculate next execution time
                let nextExecutionTime: Date | null = null;
                const currentExecution = new Date(task.next_execution_time);

                switch (task.recurrence_day) {
                    case "custom":
                        if (!task.custom_days || task.custom_days.length === 0) {
                            console.error("❌ Custom recurrence requires custom_days");
                            return;
                        }
                        // TODO: Implement custom days logic
                        break;

                    case "daily":
                        nextExecutionTime = new Date(currentExecution);
                        nextExecutionTime.setDate(currentExecution.getDate() + 1);
                        break;

                    case "weekly":
                        nextExecutionTime = new Date(currentExecution);
                        nextExecutionTime.setDate(currentExecution.getDate() + 7);
                        break;

                    case "monthly":
                        nextExecutionTime = new Date(currentExecution);
                        nextExecutionTime.setMonth(currentExecution.getMonth() + 1);
                        break;

                    case "yearly":
                        nextExecutionTime = new Date(currentExecution);
                        nextExecutionTime.setFullYear(currentExecution.getFullYear() + 1);
                        break;

                    default:
                        console.error("❌ Invalid recurrence_day:", task.recurrence_day);
                        return;
                }

                if (!nextExecutionTime) return;

                // Check if next execution would be past end date
                const nextExecDate = new Date(nextExecutionTime);
                nextExecDate.setHours(0, 0, 0, 0);

                if (nextExecDate > endDate) {
                    await dbClient("tasks")
                        .where({ id: job.data.jobId })
                        .update({ status: "not active" });
                    console.log("🏁 Next execution would be past end date - completing task");
                    return;
                }

                // Update task with next execution time
                await dbClient("tasks")
                    .where({ id: job.data.jobId })
                    .update({ next_execution_time: nextExecutionTime });

                // Create new task_history record for the NEXT execution
                const [taskHistoryRecord] = await dbClient("task_history")
                    .insert({
                        task_id: job.data.jobId,
                        status: "pending",
                        scheduled_for: nextExecutionTime,
                        created_at: new Date()
                    })
                    .returning("id");

                console.log(`📝 Created task_history record ${taskHistoryRecord.id} for next execution`);

                // Schedule the next job with delay (10 minutes before nextExecutionTime)
                const tenMinutesInMs = 10 * 60 * 1000;
                const delayMs = nextExecutionTime.getTime() - Date.now() - tenMinutesInMs;

                if (delayMs < 0) {
                    console.warn("⚠️ Next execution time is less than 10 minutes away or in the past!");
                }

                await emailQueue.add(
                    task.title,
                    {
                        jobId: job.data.jobId,
                        email: job.data.email,
                        taskHistoryId: taskHistoryRecord.id  // ← Pass the new task_history ID!
                    },
                    {
                        delay: Math.max(0, delayMs),
                        jobId: `task-${job.data.jobId}-${nextExecutionTime.getTime()}`
                    }
                );

                console.log(`⏰ Next execution scheduled for ${nextExecutionTime.toISOString()}`);

            } else {
                // Non-recurring task - mark as not active
                await dbClient("tasks")
                    .where({ id: job.data.jobId })
                    .update({ status: "not active" });

                console.log("✅ One-time task completed");
            }

        } catch (error) {
            console.error("❌ Error processing job:", error);

            // Update task_history as failed (use correct ID!)
            if (job.data.taskHistoryId) {
                await dbClient("task_history")
                    .where({ id: job.data.taskHistoryId })
                    .update({
                        status: "failed",
                        error_message: error.message,
                        failed_at: new Date()
                    });
            }

            throw error;
        }
    },
    {
        connection: redisConnection
    }
);

worker.on("completed", (job) => {
    console.log(`✅ Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
    console.error(`❌ Job ${job?.id} failed:`, err.message);

    // Update task_history to failed
    if (job?.data?.jobId) {
        (async () => {
            try {
                await dbClient("task_history")
                    .where({ task_id: job.data.jobId })
                    .update({
                        status: "failed",
                    });
            } catch (error) {
                console.error("Error updating failed task_history:", error);
            }
        })();
    }
});


// The welcome email worker is automatically started when imported
// No need to call .run() as BullMQ workers start automatically
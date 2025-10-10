import express from "express"
import dbClient from "../db/index.js"
import { emailQueue } from "../queues/queues.js"
import fetchuser from "../middleware/authmiddlleware.js"


// 2025 -09 - 22 16: 47: 34.064941 +00
import { resend } from "../queues/worker/welcomeEmailWorker.js"

interface Task {
    title: string
    status: string
    start_date: Date
    end_date: Date
    user_id: number
    is_recurring: boolean
    recurrence_day: string
    custom_days: string[]
}
const router = express.Router()

const checkTask = async (userId: number, startDate: Date, endDate: Date) => {
    const tasks = await dbClient("tasks").where({ user_id: userId, start_date: startDate, end_date: endDate })
    if (tasks.length > 0) {
        return true
    }
    return false
}

// constraint: can create only one task at a time
const createTask = async (req: express.Request, res: express.Response) => {
    try {
        const { title, start_date, end_date, recurrence_day, custom_days }: Task = req.body;
        const userId = req.user.id
        // Convert dates from string → Date object
        let startDate
        if (new Date(start_date) <= new Date() == true) {
            return res.status(400).send("Start date or time must be in the future");
        }
        startDate = new Date(start_date);
        const endDate = new Date(end_date);
        console.log("start date and end date: ", startDate, "  ", endDate)

        // get all the task and check whether it matches the start time and end time, if yes , return error else pass
        if (await checkTask(userId, startDate, endDate)) {
            return res.status(400).send("You already have a task at this time");
        }

        let nextExecutionTime: Date | null = null;
        let isRecurring = false;

        switch (recurrence_day) {
            case "custom":
                if (!custom_days || custom_days.length === 0) {
                    return res.status(400).send("Please select at least one day");
                }
                isRecurring = true;
                // TODO: calculate nextExecutionTime based on closest custom day
                break;

            case "daily":
                nextExecutionTime = new Date(startDate);
                nextExecutionTime.setDate(startDate.getDate() + 1);
                isRecurring = true;
                break;

            case "weekly":
                nextExecutionTime = new Date(startDate);
                nextExecutionTime.setDate(startDate.getDate() + 7);
                isRecurring = true;
                break;

            case "monthly":
                nextExecutionTime = new Date(startDate);
                nextExecutionTime.setMonth(startDate.getMonth() + 1);
                isRecurring = true;
                break;

            case "yearly":
                nextExecutionTime = new Date(startDate);
                nextExecutionTime.setFullYear(startDate.getFullYear() + 1);
                isRecurring = true;
                break;
        }

        const user_id = req.user.id;

        const [createdTask] = await dbClient("tasks")
            .insert({
                title,
                status: "active",
                start_date: startDate,
                end_date: endDate,
                user_id,
                is_recurring: isRecurring,
                recurrence_day,
                next_execution_time: startDate,

            })
            .returning("*");


        const tenMinuteInMs = 10 * 60 * 1000;
        const delayMs = startDate.getTime() - Date.now() - tenMinuteInMs
        // If you want to enqueue:
        await emailQueue.add(title, {
            jobId: createdTask.id,
            email: req.user.email,
            title: title,
            startDate: startDate,
            taskHistoryId: createdTask.id
        },

            {
                delay: Math.max(0, delayMs),
                jobId: `task-${createdTask.id}-${startDate.getTime()}`,
                removeOnComplete: true, removeOnFail: true
            },
        );
        await dbClient("task_history").insert({
            task_id: createdTask.id,
            status: "pending",
            scheduled_for: startDate
        })

        // sending an email for scheduling a task
        const userEmail = req.user?.email;

        if (!userEmail) {
            console.warn("User email is not available. Skipping email notification.");
        } else {
            const { data, error } = await resend.emails.send({
                from: `DayMeetingScheduler <noreply@${process.env.EMAIL_DOMAIN}>`,
                to: [userEmail],
                subject: `Task Scheduled for - ${title}`,
                html: `
                    <h1>Task Scheduled for - ${title}</h1>
                    <p>Task scheduled successfully</p>
                    <p>Task will be executed at ${startDate}</p>
                    <p>Best regards,<br/>The Team</p>
                `
            });

            if (error) {
                console.error("Error sending scheduling task email:", error);
                // Don't throw the error to prevent task creation from failing
                // Just log it and continue
            }
        }


        return res
            .status(201)
            .json({ message: "Task created successfully", data: createdTask });
    } catch (error) {
        console.error("Error creating task:", error);
        return res.status(500).send("Internal error occurred");
    }
};


const GetAllJobInfo = async (req: express.Request, res: express.Response) => {
    try {
        const waitingJobs = await emailQueue.getWaiting();      // Jobs waiting to be processed
        const activeJobs = await emailQueue.getActive();        // Jobs currently being processed
        const completedJobs = await emailQueue.getCompleted();  // Successfully completed jobs
        const failedJobs = await emailQueue.getFailed();        // Failed jobs
        const delayedJobs = await emailQueue.getDelayed();      // Scheduled/delayed jobs

        console.log('Waiting:', waitingJobs.length);
        console.log('Active:', activeJobs.length);
        console.log('Completed:', completedJobs.length);
        console.log('Failed:', failedJobs.length);
        console.log('Delayed:', delayedJobs.length);
        res.status(200).json({ waitingJobs, activeJobs, completedJobs, failedJobs, delayedJobs });
    } catch (error) {
        console.error("Error creating task:", error);
        return res.status(500).send("Internal error occurred");
    }
}


// delete in such a way - it deleted the task as well as the job in the queue
const deleteTask = async (req: express.Request, res: express.Response) => {
    try {
        const taskId = req.params.task_id
        const task = await dbClient("tasks").where({ id: taskId }).select("*").first()
        if (!task) {
            return res.status(404).send("Task not found")
        }
        const taskHistory_delete = await dbClient("task_history").where({ task_id: taskId }).delete().returning("*")
        console.log("task history deletion: ", taskHistory_delete)
        const task_delete = await dbClient("tasks").where({ id: taskId }).del().returning("*")
        console.log("task deletion: ", task_delete)

        // now delete it from queue
        const result = await emailQueue.removeJobScheduler(taskId || "")
        console.log("result", result)
        // if removed , now send email that this task has been deleted
        if (result) {
            const { data, error } = await resend.emails.send({
                from: `DayMeetingScheduler <noreply@${process.env.EMAIL_DOMAIN}`,
                to: [req.user.email],
                subject: `Task Deleted - ${task.title}`,
                html: `
            <h1>Task Deleted</h1>
            <p>Task deleted successfully</p>
            <p>Best regards,<br/>The Team</p>
            `
            })
            if (error) {
                console.error("Error sending email after deleting task")
            }
        }
        return res.status(200).send("Task deleted successfully")


    } catch (error) {
        console.error("Error deleting task")
        return res.status(500).send("Internal error occurred while deleting task")
    }
}

const updateTask = async (req: express.Request, res: express.Response) => {
    try {
        const taskId = req.params.task_id

    } catch (error) {
        console.error("Error while updating task")
        return res.status(500).send("Internal error occurred while updating task")
    }
}

const deleteAllJobs = async (req: express.Request, res: express.Response) => {
    try {
        await emailQueue.obliterate()
        res.status(200).send("All jobs deleted successfully")
    } catch (error) {
        console.error("Error deleting all jobs")
        return res.status(500).send("Internal error occurred while deleting all jobs")
    }
}

router.post("/createtask", fetchuser, createTask)
router.get("/jobInfo", fetchuser, GetAllJobInfo)
router.delete("/deletetask/:task_id", fetchuser, deleteTask)
router.put("/updatetask/:task_id", fetchuser, updateTask)
router.delete("/deleteAllJobs", fetchuser, deleteAllJobs)

export default router
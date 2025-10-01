import express from "express"
import dbClient from "../db/index.ts"
import { emailQueue } from "../queues/queues.ts"
import fetchuser from "../middleware/authmiddlleware.ts"
import { create } from "domain"
// 2025 -09 - 22 16: 47: 34.064941 +00

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


const createTask = async (req: express.Request, res: express.Response) => {
    try {
        const { title, start_date, end_date, recurrence_day, custom_days }: Task = req.body;

        // Convert dates from string → Date object
        const startDate = new Date(start_date);
        const endDate = new Date(end_date);
        console.log("start date and end date: ", startDate, "  ", endDate)

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

        console.log("created task:", createdTask);

        // If you want to enqueue:
        await emailQueue.add(title, {
            jobId: createdTask.id,
            email: req.user.email,
        });
        await dbClient("task_history").insert({
            task_id: createdTask.id,
            status: "pending",
            scheduled_for: startDate
        })

        return res
            .status(201)
            .json({ message: "Task created successfully", data: createdTask });
    } catch (error) {
        console.error("Error creating task:", error);
        return res.status(500).send("Internal error occurred");
    }
};


router.post("/createtask", fetchuser, createTask)

export default router
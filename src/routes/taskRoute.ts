import express from "express"
import dbClient from "../db/index.ts"
// 2025 -09 - 22 16: 47: 34.064941 +00

interface Task {
    title: string
    status: string
    start_date: Date
    end_date: Date
    user_id: number
    is_recurring: boolean
    next_execution_time: Date
}
const router = express.Router()

const createTask = async (req, res) => {
    try {
        const { title, start_date, end_date, is_recurring, next_execution_time }: Task = req.body
        const user_id = req.user.id
        const createtask = await dbClient("tasks").insert({
            title,
            start_date,
            end_date,
            user_id,
            is_recurring,
            next_execution_time
        })
        res.send(createtask)
    } catch (error) {
        res.status(500).send("Internal error occurred")
    }
}
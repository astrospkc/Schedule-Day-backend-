import express from "express"
import dotenv from "dotenv";
import userRouter from "./routes/userRoute.ts"
import taskRouter from "./routes/taskRoute.ts"


const env = process.env.NODE_ENV || 'local'

dotenv.config({ path: `.env.${env}` });

const date = new Date();
const istDate = new Date(date.getTime() + (5.5 * 60 * 60 * 1000));
const nextDate = new Date(istDate)
console.log("ist date: ", istDate, "next date: ", nextDate, "date now: ", Date.now())
const PORT = 7000
const app = express()
app.use(express.json())


app.use("/api/auth", userRouter)
app.use("/task", taskRouter)

app.listen(PORT, () => {
    console.log("app is running ")
})
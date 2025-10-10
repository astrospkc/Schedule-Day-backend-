import express from "express"
import dotenv from "dotenv";
import userRouter from "./routes/userRoute.js"
import taskRouter from "./routes/taskRoute.js"
import cors from "cors"
import type { CorsOptions } from "cors"

const env = process.env.NODE_ENV || 'local'

dotenv.config({ path: `.env.${env}` });

const date = new Date();
const istDate = new Date(date.getTime() + (5.5 * 60 * 60 * 1000));
const nextDate = new Date(istDate)
console.log("ist date: ", istDate, "next date: ", nextDate, "date now: ", Date.now())
const PORT = 7000
const app = express()
app.use(express.json())
const allowedOrigins = [
    "http://localhost:5173",

];

const corsOptions: CorsOptions = {
    origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
        if (!origin) {
            callback(null, true);
            return;
        }
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
};

app.use(cors(corsOptions));


app.use("/api/auth", userRouter)
app.use("/task", taskRouter)

app.listen(PORT, () => {
    console.log("app is running ")
})
import express from "express"
import dotenv from "dotenv";
import userRouter from "./routes/userRoute.ts"

dotenv.config();
const PORT = 7000
const app = express()
app.use(express.json())


app.use("/api/auth", userRouter)
app.listen(PORT, () => {
    console.log("app is running ")
})
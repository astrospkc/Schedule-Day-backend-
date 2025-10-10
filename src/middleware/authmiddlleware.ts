import express from 'express';
import type { JwtPayload } from "jsonwebtoken";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

// Extend the Express Request type to include the user property
declare global {
    namespace Express {
        interface Request {
            user?: any; // You can replace 'any' with a more specific user type if you have one
        }
    }
}

const env = process.env.NODE_ENV || 'local'

dotenv.config({ path: `.env.${env}` });

const JWT_secret = process.env.JWT_TOKEN || ""
// console.log("jwt secret: ", JWT_secret);


const fetchuser = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    //get the user from jwttoken and add id to req object
    console.log("going through me")
    try {
        const token = req.headers["authorization"]?.split(" ")[1];
        // console.log("token", token)
        if (!token) {
            return res
                .send({ error: "Authenticate using a valid token initial" });
        }
        if (!JWT_secret) {
            return res.status(500).json({ error: "JWT secret is not configured" });
        }
        const data = jwt.verify(token, JWT_secret) as JwtPayload & { user: any }; // Replace 'any' with your user type
        console.log("data: ", data)

        if (!data.user) {
            return res.status(401).json({ error: "Invalid token: user data not found" });
        }

        req.user = data.user;
        next();


    } catch (error) {
        res.status(401).send({ error: "Authenticate using a valid token" });
    }
};

export default fetchuser;
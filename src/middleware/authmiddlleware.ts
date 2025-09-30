import express from 'express';
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
const env = process.env.NODE_ENV || 'local'

dotenv.config({ path: `.env.${env}` });

const JWT_secret = process.env.JWT_TOKEN || ""
// console.log("jwt secret: ", JWT_secret);


const fetchuser = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    //get the user from jwttoken and add id to req object
    console.log("going through me")
    try {
        const token = req.headers["authorization"]?.split(" ")[1];
        console.log("token", token)
        if (!token) {
            res
                .status(401)
                .send({ error: "Authenticate using a valid token initial" });
        }
        if (!JWT_secret) {
            res.status(401).send({ error: "jwt secret not found" })
        }
        console.log("jwt secret: ", JWT_secret)
        const data = jwt.verify(token, JWT_secret);
        console.log("data: ", data)

        req.user = data.user;
        next();


    } catch (error) {
        res.status(401).send({ error: "Authenticate using a valid token" });
    }
};

export default fetchuser;
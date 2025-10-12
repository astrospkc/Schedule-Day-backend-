import express from 'express';
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config()
const JWT_secret = process.env.JWT_TOKEN || "";
// console.log("jwt secret: ", JWT_secret);
const fetchuser = async (req, res, next) => {
    //get the user from jwttoken and add id to req object
    console.log("going through me");
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
        const data = jwt.verify(token, JWT_secret); // Replace 'any' with your user type
        console.log("data: ", data);
        if (!data.user) {
            return res.status(401).json({ error: "Invalid token: user data not found" });
        }
        req.user = data.user;
        next();
    }
    catch (error) {
        res.status(401).send({ error: "Authenticate using a valid token" });
    }
};
export default fetchuser;
//# sourceMappingURL=authmiddlleware.js.map
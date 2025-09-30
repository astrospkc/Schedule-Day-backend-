// import express
// express js is the backend part of MEAN and manages routing, sessions, HTTP requests, error handling
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fetchuser from "../middleware/authmiddlleware.ts";
import dbClient from "../db/index.ts";


const router = express.Router();
// const { body, validationResult } = require("express-validator");
const JWT_SECRET = process.env.JWT_TOKEN || "any_secret"

//create a User using: POST "/api/auth/createuser". No login required

const register = async (req: express.Request, res: express.Response) => {
    // console.log(req.body);
    let success = false;
    try {
        let user = await dbClient.select("email").from("users").where({ email: req.body.email });
        if (user.length < 0) {
            return res.status(400).json({
                success,
                error: "Sorry a user with this email already exist.",
            });
        }

        const salt = await bcrypt.genSalt(10);
        const secPass = bcrypt.hashSync(req.body.password, salt);

        // create a user
        user = await dbClient("users").insert({
            name: req.body.name,
            email: req.body.email,
            password: secPass,
        }).returning("*");

        const data = {
            user: {
                id: user[0].id,
                email: user[0].email
            },
        };

        // const authtoken = jwt.sign({ data }, JWT_SECRET, { expiresIn: "1h" });

        const authtoken = jwt.sign(data, JWT_SECRET);
        success = true;

        res.json({ success, authtoken });
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal error occurred");
    }
}


const login = async (req: express.Request, res: express.Response) => {
    let success = false;
    const { email, password } = req.body;

    try {
        let user = await dbClient.select("id", "email", "password").from("users").where({ email });
        console.log(user)
        if (user.length < 0) {
            success = false;
            return res
                .status(400)
                .json({ success, error: "Please login with correct credentials" });
        }

        const passwordCompare = await bcrypt.compare(password, user[0].password);
        if (!passwordCompare) {
            success = false;
            return res
                .status(400)
                .json({ error: "Please login with correct credentials" });
        }
        const data = {
            user: {
                id: user[0].id,
                email: user[0].email
            },
        };
        console.log("jwt secret in auth: ", JWT_SECRET)
        const authtoken = jwt.sign(data, JWT_SECRET);
        success = true;
        res.json({ success, authtoken });
        // }
    } catch (error) {
        console.log("error: ", error)
        console.error(error.message);
        res.status(500).send("Internal error occurred", error.message);
    }
}


const getUserInfo = async (req, res) => {
    try {
        const user_id = req.user.id;
        const user = await dbClient.select("*").from("users").where({ id: user_id });
        res.send(user);
    } catch (error) {
        res.status(500).send("Internal error occurred");
    }
}


router.post("/register", register);
router.post("/login", login);
router.get("/getuserinfo", fetchuser, getUserInfo);


export default router;
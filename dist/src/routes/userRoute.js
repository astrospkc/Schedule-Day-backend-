// import express
// express js is the backend part of MEAN and manages routing, sessions, HTTP requests, error handling
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fetchuser from "../middleware/authmiddlleware";
import User from "../models/User.js";
const router = express.Router();
// const { body, validationResult } = require("express-validator");
const JWT_SECRET = process.env.JWT_TOKEN;
console.log("jwt secret: ", JWT_SECRET);
//create a User using: POST "/api/auth/createuser". No login required
const register = async (req, res) => {
    // console.log(req.body);
    let success = false;
    const name_anonymous = generateAnonymousName();
    try {
        let user = await User.findOne({ email: req.body.email });
        if (user) {
            return res.status(400).json({
                success,
                error: "Sorry a user with this email already exist.",
            });
        }
        const salt = await bcrypt.genSalt(10);
        const secPass = bcrypt.hashSync(req.body.password, salt);
        // create a user
        user = await User.create({
            name: req.body.name,
            anonymousName: name_anonymous,
            password: secPass,
            email: req.body.email,
        });
        const data = {
            user: {
                id: user.id,
            },
        };
        // const authtoken = jwt.sign({ data }, JWT_SECRET, { expiresIn: "1h" });
        const authtoken = jwt.sign(data, JWT_SECRET);
        success = true;
        res.json({ success, authtoken });
    }
    catch (error) {
        console.error(error.message);
        res.status(500).send("Internal error occurred");
    }
};
//Login : POST "/api/auth/login".
const login = async (req, res) => {
    let success = false;
    const { email, password } = req.body;
    try {
        let user = await User.findOne({ email });
        // console.log({ user });
        if (!user) {
            success = false;
            return res
                .status(400)
                .json({ success, error: "Please login with correct credentials" });
        }
        const passwordCompare = await bcrypt.compare(password, user.password);
        if (!passwordCompare) {
            success = false;
            return res
                .status(400)
                .json({ error: "Please login with correct credentials" });
        }
        const data = {
            user: {
                id: user.id,
            },
        };
        console.log("login");
        // const authtoken = jwt.sign({ data }, JWT_SECRET, { expiresIn: "1h" });
        const authtoken = jwt.sign(data, JWT_SECRET);
        success = true;
        // console.log("req.headers: ", req.headers);
        console.log(success, authtoken);
        res.json({ success, authtoken });
        // }
    }
    catch (error) {
        console.error(error.message);
        res.status(500).send("Internal error occurred", error.message);
    }
};
// ROUTE 2: get user details, POST : "api/auth/getuser" Login required
router.get("/getuser", fetchuser, async (req, res) => {
    try {
        const userId = req.user.id;
        console.log("user id: ", userId);
        const user = await User.findById(userId).select("-password");
        res.send(user);
    }
    catch (error) {
        console.error(error.message);
        res.status(500).send("Internal error occurred");
    }
});
// ROUTE 3: get user details, POST : "api/auth/getuser" Login required
router.get("/getuser/:userid", fetchuser, async (req, res) => {
    try {
        // const userId = req.user.id;
        const userId = req.params.userid;
        const user = await User.findById(userId).select("password");
        res.send(user);
    }
    catch (error) {
        console.error(error.message);
        res.status(500).send("Internal error occurred");
    }
});
router.get("/getalluser", async (req, res) => {
    try {
        const users = await User.find();
        console.log("user: ", users);
        res.json(users);
    }
    catch (error) {
        console.error(error.message);
        res.status(500).send("Internal error occurred");
    }
});
const deleteUser = async (req, res) => {
    try {
        const { user_id } = req.params;
        // delete post, comments, bookmark, community, journal
        await Journal.deleteMany({ user: user_id });
        await Bookmark.deleteMany({ userId: user_id });
        await Comment.deleteMany({ createdBy: user_id });
        await Community.deleteMany({ createdBy: user_id });
        await Feedback.deleteMany({ userId: user_id });
        await Like.deleteMany({ userId: user_id });
        await Post.deleteMany({ createdBy: user_id });
        await User.findByIdAndDelete(user_id);
        res.json("user is deleted");
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
const deleteAllUser = async (req, res) => {
    try {
        const user = await User.deleteMany();
        res.json(user);
    }
    catch (error) {
        console.error(error.message);
        res.status(500).send("Internal error eccurred");
    }
};
router.delete("/deleteAllUser", deleteAllUser);
router.delete("/deleteUser/:user_id", deleteUser);
export default router;
//# sourceMappingURL=userRoute.js.map
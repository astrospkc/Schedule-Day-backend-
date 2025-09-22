import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const JWT_secret = process.env.JWT_TOKE || "any_secret"

const fetchuser = async (req, res, next) => {
    //get the user from jwttoken and add id to req object

    const token = req.headers["authorization"]?.split(" ")[1];

    try {
        if (!token) {
            res
                .status(401)
                .send({ error: "Authenticate using a valid token initial" });
        }
        if (!JWT_secret) {
            res.status(401).send({ error: "jwt secret not found" })
        }

        const data = jwt.verify(token, JWT_secret);
        req.user = data.user;
        next();


    } catch (error) {
        res.status(401).send({ error: "Authenticate using a valid token" });
    }
};

export default fetchuser;
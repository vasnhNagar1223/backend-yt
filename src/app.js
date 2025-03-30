import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(cors({origin: process.env.CORS_ORIGIN, credentials: true}));

app.use(express.json({limit: "16kb"})); // configure json so that data can come in json || limit to prevent spam
app.use(express.urlencoded({extended: true, limit: "16kb"})); //configure data coming from url - make it good like vansh nagar will be - vansh+nagar ||
//extended means multiple level of objects can come || limit to prevent spam etc
app.use(express.static("public")); // tell express static files are present in public so that we don't neet to write ../public/---/--- insted /---/---
app.use(cookieParser());

//routes import
import userRouter from "./routes/user.routes.js";

//routes declaration
app.use("/api/v1/users", userRouter); // this url tell this is api version 1 for users

export default app;

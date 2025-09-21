import dotenv from "dotenv";
dotenv.config();

import express from "express";
import connect from "./mongodb/connect.js";
import cors from "cors";
import { fileURLToPath } from 'url';
import path from 'path'
import user from "./routes/user.js";
import company from "./routes/company.js";
import admin from "./routes/admin.js"

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

connect();
const app = express();
const port = process.env.PORT;

app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5001", 
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


//Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.get("/", (req, res) =>{
    res.send("Hello NextStep officially starting...");
});

app.use('/user', user);
app.use('/company', company);
app.use('/admin', admin);

app.listen(port, (req, res) =>{
    console.log("Server running...", port);
});
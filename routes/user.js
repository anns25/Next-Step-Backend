import { Router } from "express";
import { deleteMyAccount, deleteUser, getMyProfile, getUserById, loginUser, registerUser, updateMyProfile } from "../controllers/user.js";
import upload from "../middlewares/multer.js";
import { validateLogin, validateSignup, validateUpdateUser } from "../validators/userValidator.js";
import { validate } from "../middlewares/validate.js";
import { authCheck } from "../middlewares/authCheck.js";
import { check } from "express-validator";



const user = Router();

user.post("/register", upload.single('profilePicture'), validateSignup, validate, registerUser);
user.post("/login", validateLogin, validate, loginUser);
user.get('/profile', authCheck, getMyProfile);
user.get('/profile/:id', authCheck, getUserById);
user.patch('/profile', authCheck, upload.single('profilePicture'), validateUpdateUser, validate, updateMyProfile);
user.delete('/profile', authCheck, deleteMyAccount);
user.delete('/profile/:id', authCheck, deleteUser);

export default user
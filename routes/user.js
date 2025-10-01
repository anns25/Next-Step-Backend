import { Router } from "express";
import { deleteMyAccount, deleteUser, getMyProfile, getUserById, loginUser, registerAdmin, registerUser, updateMyProfile } from "../controllers/user.js";
import { uploadImage } from "../middlewares/multer.js";
import { validateAdminSignup, validateLogin, validateSignup, validateUpdateUser } from "../validators/userValidator.js";
import { validate } from "../middlewares/validate.js";
import { authCheck } from "../middlewares/authCheck.js";



const user = Router();

//Public routes
user.post('/signup/admin', uploadImage.single('profilePicture'), validateAdminSignup, validate, registerAdmin);
user.post("/register", uploadImage.single('profilePicture'), validateSignup, validate, registerUser);
user.post("/login", validateLogin, validate, loginUser);

//Protected routes
user.get('/profile', authCheck, getMyProfile);
user.get('/profile/:id', authCheck, getUserById);
user.patch('/profile', authCheck, uploadImage.single('profilePicture'), validateUpdateUser, validate, updateMyProfile);
user.delete('/profile', authCheck, deleteMyAccount);

//Admin routes
user.delete('/profile/:id', authCheck, deleteUser);

export default user
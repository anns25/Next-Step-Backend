import User from "../models/User.js";
import jwt from "jsonwebtoken";
// import { sendWelcomeEmail } from "../services/emailService.js";

export const registerUser = async (req, res) => {
  try {
    const SECRET_KEY = process.env.SECRET_KEY;
    const { firstName, lastName, password, role, email } = req.body;

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: "Profile picture is required." });
    }

    // Get file path from multer
    const profilePicture = req.file.filename;

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    // Create new user
    const newUser = new User({
      firstName,
      lastName,
      email,
      password,
      role,
      profilePicture
    });
    await newUser.save();

    // Send welcome email (async, don't block response)
    // sendWelcomeEmail(email, firstName)
    //   .then(result => {
    //     if (result.success) {
    //       console.log("Welcome email sent to:", email);
    //     } else {
    //       console.log("Failed to send welcome email:", result.error);
    //     }
    //   })
    //   .catch(err => console.error("Error in welcome email process:", err));

    // Generate JWT
    const token = jwt.sign(
      {
        _id: newUser._id,
        fullName: newUser.fullName,
        role: newUser.role,
        email: newUser.email,
        profilePicture: newUser.profilePicture
      },
      SECRET_KEY,
      { expiresIn: "1d" }
    );

    res.status(201).json({
      data: token,
      user: newUser,
      message: "New User created"
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const loginUser = async (req, res) => {
  const SECRET_KEY = process.env.SECRET_KEY;
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email, is_deleted: false });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid Credentials" });
    }

    // Update last login timestamp
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = jwt.sign(
      {
        _id: user._id,
        fullName: user.fullName,
        role: user.role,
        email: user.email,
        profilePicture: user.profilePicture
      },
      SECRET_KEY,
      { expiresIn: "1d" }
    );

    res.status(200).json({
      data: token,
      user: user,
      message: "Login Successful"
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// @desc    Get logged-in user profile
// @route   GET /user/profile
// @access  Private
export const getMyProfile = async (req, res) => {
  try {
    // req.user is set by your auth middleware after verifying JWT
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user); // thanks to toJSON in schema, password won’t be included
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// @desc    Get user profile by ID
// @route   GET /user/profile/:id
// @access  Public (or Private depending on your needs)
export const getUserById = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id, is_deleted: false });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// @desc    Update logged-in user profile
// @route   PATCH /user/profile
// @access  Private
export const updateMyProfile = async (req, res) => {
  try {
    const { ...updates } = req.body;

    // If profile picture is uploaded
    if (req.file) {
      updates.profilePicture = req.file.filename;
    }

    const updatedUser = await User.findOneAndUpdate(
      { _id: req.user._id, is_deleted: false },
      updates,
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(updatedUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// @desc Delete User (soft delete themselves)

export const deleteMyAccount = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndUpdate(
      req.user._id,
      { is_deleted: true },
      { new: true }
    );

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User soft-deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//@desc Admin can delete any user

export const deleteUser = async (req, res) => {
  try {


    if (req.user.role === "admin") {
      // Admins can delete by ID in route param
      const targetUserId = req.params.id;


      const deletedUser = await User.findOneAndUpdate(
        { _id: targetUserId, is_deleted: false },
        { is_deleted: true },
        { new: true }
      );

      if (!deletedUser) {
        return res.status(404).json({ message: "User not found or already deleted" });
      }

      res.status(200).json({
        message: "User soft-deleted successfully",
        user: deletedUser
      });
    }
    else {
      res.status(403).json({ message: "Not authorized to delete user" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};




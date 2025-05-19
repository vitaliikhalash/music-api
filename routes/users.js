import express from "express";
import {
    registerUser,
    loginUser,
    fetchAllUsers,
    fetchUserById,
    createNewUser,
    updateExistingUser,
    deleteExistingUser,
} from "../controllers/users.controller.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/", fetchAllUsers);
router.get("/:id", fetchUserById);
router.post("/", createNewUser);
router.patch("/:id", updateExistingUser);
router.delete("/:id", deleteExistingUser);

export default router;

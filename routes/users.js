import express from "express";
import {
    fetchAllUsers,
    fetchUserById,
    createNewUser,
    updateExistingUser,
    deleteExistingUser,
} from "../controllers/users.controller.js";

const router = express.Router();

router.get("/", fetchAllUsers);
router.get("/:id", fetchUserById);
router.post("/", createNewUser);
router.patch("/:id", updateExistingUser);
router.delete("/:id", deleteExistingUser);

export default router;

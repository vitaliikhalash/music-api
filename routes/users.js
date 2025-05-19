import express from "express";
import {
    registerUser,
    loginUser,
    fetchCurrentUser,
    updateCurrentUser,
    deleteCurrentUser,
} from "../controllers/users.controller.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", fetchCurrentUser);
router.patch("/me", updateCurrentUser);
router.delete("/me", deleteCurrentUser);

export default router;

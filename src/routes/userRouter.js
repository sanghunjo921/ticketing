import express from "express";
import { userController } from "../controllers/userController";

export const userRouter = express.Router();

userRouter.get("/", userController.getAllUsers);
userRouter.get("/:id", userController.getUserById);

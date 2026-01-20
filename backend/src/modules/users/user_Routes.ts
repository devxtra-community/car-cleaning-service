import { Router } from "express";
import { registerUser } from "./user_Controller";

const router = Router();

router.post("/register", registerUser);

export default router;
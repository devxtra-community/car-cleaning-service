import { Request, Response } from "express";
import { createUser } from "./user_service";
import { logger } from "../../config/logger";

export const registerUser = async (req: Request, res: Response) => {
  try {
    logger.info('Registration attempt', { email: req.body.email });
    
    // Validate required fields
    const { email, password, role, app_type, full_name } = req.body;
    
    if (!email || !password || !role || !app_type || !full_name) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }
    
    const user = await createUser(req.body);
    
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: user
    });
  } catch (error: any) {
    logger.error('Registration failed', { error: error.message });
    
    // Handle duplicate email error
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: "Email already exists"
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Registration failed",
      error: error.message
    });
  }
};
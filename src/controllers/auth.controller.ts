import { Request, Response, NextFunction } from 'express';
import * as AuthService from "../services/auth.service";

export const register = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;
        const token = await AuthService.register(email, password);
        res.status(201).json({
            message: 'User Created Successfully. Login with credentials'
        })
    } catch (err) {
        next(err);
    }
}

export const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;
        const token = await AuthService.login(email, password);
        res.status(201).json({ token })
    } catch (err) {
        next(err);
    }
}
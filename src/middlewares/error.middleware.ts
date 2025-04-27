import { Request, Response, NextFunction } from 'express';

export const errorMiddleware = (err: any, req: Request, res: Response, next: NextFunction) => {
    console.error("Middleware Error:", err);
    res.status(500).json({
        message: err.message || 'Internal Server Error'
    })
    return;
}
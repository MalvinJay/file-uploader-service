import { Request, Response, NextFunction } from 'express';
import * as FileService from '../services/file.service';

export const uploadFile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const file = req.body.file; // Assume file coming is base64 encoded or similar
        const filename = req.body.filename;
        const userId = (req as any).user.id;
        const url = await FileService.upload(file, filename, userId);
        res.status(201).json({ url })
    } catch (err) {
        next(err);
    }
}

export const listFiles = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.id;
        const files = await FileService.list(userId)
        res.status(200).json({ files })
    } catch (err) {
        next(err);
    }
}

export const deleteFile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user.id;
        await FileService.deleteFile(parseInt(id), userId)
        res.status(204).send()
    } catch (err) {
        next(err);
    }
}
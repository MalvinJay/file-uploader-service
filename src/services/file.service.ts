import prisma from '../prisma/client';
import { s3 } from "../utils/s3";
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv'
dotenv.config();

const BUCKET_NAME = process.env.AWS_BUCKET_NAME!;

export const upload = async (file: string, filename: string, userId: number) => {
    try {
        const { dbRecordFile, url }: any = await prisma.$transaction(async (tx: any) => {
            const key = `${uuidv4()}-${filename}`;
            await s3.putObject({
                Bucket: BUCKET_NAME,
                Key: key,
                Body: Buffer.from(file, 'base64'),
                ContentType: 'application/octet-stream'
            }).promise();

            const url = `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`

            const dbRecordFile = await prisma.file.create({
                data: { key, url, userId }
            });

            return { dbRecordFile, url };
        });
        return url;
    } catch (error: any) {
        throw new Error(error);
    }
}

export const list = async (userId: number) => {
    return await prisma.file.findMany({
        where: { userId },
        orderBy: {
            createdAt: 'desc'
        }
    });
}

export const deleteFile = async (id: number, userId: number) => {
    try {
        const { file }: any = await prisma.$transaction(async (tx: any) => {
            const file = await prisma.file.findUnique({ where: { id } })
            if (!file || file.userId !== userId) throw new Error("File does not exist");

            // Delete on s3
            await s3.deleteObject({
                Bucket: BUCKET_NAME,
                Key: file.key
            }).promise()

            // Delete on db
            await prisma.file.delete({ where: { id } })

            return { file };
        })
        return file;
    } catch (error: any) {
        throw new Error(error);
    }
}
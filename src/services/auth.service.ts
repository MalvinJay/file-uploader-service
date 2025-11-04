import bycrypt from 'bcryptjs';
import prisma from '../prisma/client';
import { signToken } from '../utils/jwt';

export const register = async (email: string, password: string) => {
    try {
        const { token }: any = await prisma.$transaction(async (tx: any) => {
            const existingUser = await prisma.user.findUnique({ where: { email } })
            if (existingUser) throw new Error('Email already exists');

            const hashedPassword = await bycrypt.hash(password, 10);
            const user = await prisma.user.create({
                data: { email, password: hashedPassword }
            });
            const token = signToken({ id: user.id, email: user.email });
            return { user, token };
        })
        return token;
    } catch (error: any) {
        throw new Error(error);
    }
}

export const login = async (email: string, password: string) => {
    try {
        const { token }: any = await prisma.$transaction(async (tx: any) => {
            const user = await prisma.user.findUnique({ where: { email } })
            if (!user) throw new Error('Invalid credentials');

            const isMatch = await bycrypt.compare(password, user.password);
            if (!isMatch) throw new Error('Invalid credentials');

            const token = signToken({ id: user.id, email: user.email });
            return { user, token };
        })
        return token;
    } catch (error: any) {
        throw new Error(error);
    }
}

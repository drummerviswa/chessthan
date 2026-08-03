import type { User } from "../../types_config/index.d.ts";
import { prisma } from "../index.js";

export const create = async (user: User, password: string) => {
    if (user.name === "Guest" || !user.name) {
        return null;
    }

    try {
        const newUser = await prisma.user.create({
            data: {
                name: user.name,
                email: user.email || null,
                password
            }
        });
        return {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email || undefined,
            wins: newUser.wins,
            losses: newUser.losses,
            draws: newUser.draws
        } as User;
    } catch (err: unknown) {
        console.error("UserModel.create error:", err);
        return null;
    }
};

export const findById = async (id: number) => {
    if (id === 0) {
        return null;
    }
    try {
        const foundUser = await prisma.user.findUnique({
            where: { id }
        });
        if (foundUser) {
            return {
                id: foundUser.id,
                name: foundUser.name,
                email: foundUser.email || undefined,
                wins: foundUser.wins,
                losses: foundUser.losses,
                draws: foundUser.draws
            } as User;
        } else return null;
    } catch (err: unknown) {
        console.log(err);
        return null;
    }
};

export const findByNameEmail = async (
    user: User,
    includePassword = false,
    limit?: number
): Promise<(User & { password?: string })[] | null> => {
    // if user is not specified, get all users
    if (!user) {
        try {
            const users = await prisma.user.findMany({
                take: limit ?? 10
            });
            return users.map((u: any) => ({
                id: u.id,
                name: u.name,
                email: u.email || undefined,
                wins: u.wins,
                losses: u.losses,
                draws: u.draws
            }));
        } catch (err: unknown) {
            console.log(err);
            return null;
        }
    }

    try {
        const conditions: any[] = [];
        if (user.name) conditions.push({ name: user.name });
        if (user.email) conditions.push({ email: user.email });

        if (conditions.length === 0) {
            return [];
        }

        const users = await prisma.user.findMany({
            where: {
                OR: conditions
            },
            take: limit ?? 1
        });

        return users.map((u: any) => ({
            id: u.id,
            name: u.name,
            email: u.email || undefined,
            wins: u.wins,
            losses: u.losses,
            draws: u.draws,
            password: u.password || undefined
        }));
    } catch (err: unknown) {
        console.log(err);
        return null;
    }
};

export const update = async (id: number, updatedUser: User & { password?: string }) => {
    if (id === 0) {
        return null;
    }

    try {
        const updateData: any = {};
        if (updatedUser.name) updateData.name = updatedUser.name;
        if (updatedUser.email) updateData.email = updatedUser.email;
        if (updatedUser.password) updateData.password = updatedUser.password;

        const updated = await prisma.user.update({
            where: { id },
            data: updateData
        });

        return {
            id: updated.id,
            name: updated.name,
            email: updated.email || undefined,
            wins: updated.wins,
            losses: updated.losses,
            draws: updated.draws
        } as User;
    } catch (err: unknown) {
        console.log(err);
        return null;
    }
};

export const remove = async (id: number) => {
    if (id === 0) {
        return null;
    }

    try {
        const deleted = await prisma.user.delete({
            where: { id }
        });
        return {
            id: deleted.id,
            name: deleted.name,
            email: deleted.email || undefined
        } as User;
    } catch (err: unknown) {
        console.log(err);
        return null;
    }
};

const UserModel = {
    create,
    findById,
    findByNameEmail,
    update,
    remove
};

export default UserModel;

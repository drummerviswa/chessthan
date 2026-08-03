import { prisma } from "../index.js";
export const create = async (user, password) => {
    if (user.name === "Guest" || user.email === undefined || !user.name) {
        return null;
    }
    try {
        const newUser = await prisma.user.create({
            data: {
                name: user.name,
                email: user.email,
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
        };
    }
    catch (err) {
        console.log(err);
        return null;
    }
};
export const findById = async (id) => {
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
            };
        }
        else
            return null;
    }
    catch (err) {
        console.log(err);
        return null;
    }
};
export const findByNameEmail = async (user, includePassword = false, limit) => {
    // if user is not specified, get all users
    if (!user) {
        try {
            const users = await prisma.user.findMany({
                take: limit ?? 10
            });
            return users.map((u) => ({
                id: u.id,
                name: u.name,
                email: u.email || undefined,
                wins: u.wins,
                losses: u.losses,
                draws: u.draws
            }));
        }
        catch (err) {
            console.log(err);
            return null;
        }
    }
    try {
        const conditions = [];
        if (user.name)
            conditions.push({ name: user.name });
        if (user.email)
            conditions.push({ email: user.email });
        if (conditions.length === 0) {
            return [];
        }
        const users = await prisma.user.findMany({
            where: {
                OR: conditions
            },
            take: limit ?? 1
        });
        return users.map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email || undefined,
            wins: u.wins,
            losses: u.losses,
            draws: u.draws,
            password: u.password || undefined
        }));
    }
    catch (err) {
        console.log(err);
        return null;
    }
};
export const update = async (id, updatedUser) => {
    if (id === 0) {
        return null;
    }
    try {
        const updateData = {};
        if (updatedUser.name)
            updateData.name = updatedUser.name;
        if (updatedUser.email)
            updateData.email = updatedUser.email;
        if (updatedUser.password)
            updateData.password = updatedUser.password;
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
        };
    }
    catch (err) {
        console.log(err);
        return null;
    }
};
export const remove = async (id) => {
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
        };
    }
    catch (err) {
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

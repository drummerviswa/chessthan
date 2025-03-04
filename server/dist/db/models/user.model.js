import { db } from "../index.js";
export const create = async (user, password) => {
    if (user.name === "Guest" || user.email === undefined) {
        return null;
    }
    try {
        const res = await db.query(`INSERT INTO "user"(name, email, password) VALUES($1, $2, $3) RETURNING id, name, email, wins, losses, draws`, [user.name, user.email || null, password]);
        return res.rows[0];
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
        const res = await db.query(`SELECT id, name, email, wins, losses, draws FROM "user" WHERE id=$1`, [id]);
        if (res.rowCount) {
            return res.rows[0];
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
            const res = await db.query(`SELECT id, name, email, wins, losses, draws FROM "user" LIMIT $1`, [limit ?? 10]);
            return res.rows;
        }
        catch (err) {
            console.log(err);
            return null;
        }
    }
    try {
        const res = await db.query(`SELECT id, name, email, wins, losses, draws${includePassword ? `, password` : ""} FROM "user" WHERE name=$1 OR email=$2 LIMIT $3`, [user.name, user.email, limit ?? 1]);
        return res.rows;
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
        let query = `UPDATE "user" SET name=$1, email=$2 WHERE id=$3 RETURNING id, name, email, wins, losses, draws`;
        let values = [updatedUser.name, updatedUser.email, id];
        if (updatedUser.password) {
            query = `UPDATE "user" SET name=$1, email=$2, password=$3 WHERE id=$4 RETURNING id, name, email, wins, losses, draws`;
            values = [updatedUser.name, updatedUser.email, updatedUser.password, id];
        }
        const res = await db.query(query, values);
        return res.rows[0];
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
        const res = await db.query(`DELETE FROM "user" WHERE id = $1 RETURNING id, name, email`, [
            id
        ]);
        return res.rows[0];
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

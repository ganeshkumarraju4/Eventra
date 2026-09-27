import "dotenv/config";
import jwt from "jsonwebtoken";

const JWT_SECRET: string | undefined = process.env.JWT_SECRET;


export function generateToken(userId: string, role: string) {
     if (!JWT_SECRET) {
        throw new Error("JWT_SECRET is not defined");
    }
    return jwt.sign(
        {
            userId,
            role,
        },
        JWT_SECRET,
        {
            expiresIn: "1h",
        }
    );
}
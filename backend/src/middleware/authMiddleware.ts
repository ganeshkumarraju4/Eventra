import { NextFunction, Request,Response } from "express";
import prisma  from "../utils/prisma";
import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET;


export const  authMiddleware = async (req: Request, res: Response, next: NextFunction)=>{
    if(!JWT_SECRET) {
        return res.status(500).json({ message: "JWT_SECRET is not defined" });
    }
    const authHeader = req.headers.authorization;

    if(!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
    return res.status(401).json({
        message: "Unauthorized"
    });
}
    try {
    const decodedToken = jwt.verify(token, JWT_SECRET);

    const { userId, role } = decodedToken as {
        userId: string;
        role: string;
    };

    const validUser = await prisma.user.findUnique({
        where: {
            id: userId
        }
    });

    if (!validUser) {
        return res.status(401).json({
            message: "Unauthorized"
        });
    }

    req.user = validUser;

    next();

} catch (error) {
    return res.status(401).json({
        message: "Unauthorized"
    });
}
    

}

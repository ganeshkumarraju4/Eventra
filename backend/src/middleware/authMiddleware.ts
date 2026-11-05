import { NextFunction, Request, Response } from "express";
import prisma from "../utils/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

export const authMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (!JWT_SECRET) {
        console.error("JWT_SECRET is not configured");

        return res.status(500).json({
            success: false,
            message: "Internal server configuration error"
        });
    }

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            message: "Authorization token is missing"
        });
    }

    const token = authHeader.slice(7).trim();

    if (!token || token.includes(" ")) {
        return res.status(401).json({
            success: false,
            message: "Invalid authorization header format"
        });
    }

    let userId: string;

    // Step 1: Verify JWT and validate its payload.
    try {
       const decodedToken = jwt.verify(token, JWT_SECRET, {
            algorithms: ["HS256"]
        });

        if (
            typeof decodedToken !== "object" ||
            decodedToken === null ||
            typeof decodedToken.userId !== "string" ||
            decodedToken.userId.trim() === ""
        ) {
            return res.status(401).json({
                success: false,
                message: "Invalid token payload"
            });
        }

        userId = decodedToken.userId;
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({
                success: false,
                message: "Token has expired. Please log in again."
            });
        }

        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({
                success: false,
                message: "Invalid authentication token"
            });
        }

        console.error("Unexpected JWT verification error");

        return res.status(500).json({
            success: false,
            message: "Authentication service error"
        });
    }

    // Step 2: Fetch the user without sensitive fields.
    try {
        const validUser = await prisma.user.findUnique({
            where: {
                id: userId
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true
            }
        });

        if (!validUser) {
            return res.status(401).json({
                success: false,
                message: "User account not found. Please log in again."
            });
        }

        req.user = validUser;

        return next();
    } catch (error) {
        console.error("Database error during authentication:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to authenticate request due to a server error"
        });
    }
};

export const optionalAuthMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (!req.headers.authorization) {
        return next();
    }

    return authMiddleware(req, res, next);
};

import { Request, Response } from "express";
import prisma from "../utils/prisma";
import { hashPassword, comparePassword } from "../utils/password";
import { generateToken } from "../utils/jwt";
export async function getMe(req: Request, res: Response) {
    return res.status(200).json({
        message: "Authenticated user",
        user: {
            id: req.user?.id,
            name: req.user?.name,
            email: req.user?.email,
            role: req.user?.role,
        }
    });
}
export async function register(req: Request, res: Response) {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Enter all required fields"
            });
        }

        const existingUser = await prisma.user.findUnique({
            where: {
                email: email,
            },
        });

        if (existingUser) {
            return res.status(400).json({
                message: "User already exists"
            });
        }

        const hashedPassword = await hashPassword(password);

        const newUser = await prisma.user.create({
            data: {
                name: name,
                email: email,
                password: hashedPassword,
            },
        });

        return res.status(201).json({
            message: "User created successfully",
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
            },
        });

    } catch (error) {
        console.error("Registration error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}


export async function login(req: Request, res: Response) {
    try {
        const { email, password } = req.body ?? {};

        // 1. Validate input.
        if (
            typeof email !== "string" ||
            email.trim().length === 0 ||
            typeof password !== "string" ||
            password.length === 0
        ) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        // 2. Find the user.
        const user = await prisma.user.findUnique({
            where: {
                email: email.trim()
            }
        });

        // 3. Use the same response for both authentication failures.
        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const isPasswordValid = await comparePassword(
            password,
            user.password
        );

        if (!isPasswordValid) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        // 4. Generate the JWT.
        const token = generateToken(user.id, user.role);

        // 5. Return only safe user properties.
        return res.status(200).json({
            message: "User logged in successfully",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}

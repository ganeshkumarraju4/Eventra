import { Request, Response } from "express";
import prisma from "../utils/prisma";
import { hashPassword, comparePassword } from "../utils/password";

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
    try{
        const {email , password} = req.body;
        const user = await prisma.user.findUnique({
            where:{
                email:email,
            },
        });
        if(!user){
            return res.status(401).json({
                message: "User doesn't exist"
            });
        }
        const hashedPassword = user.password;
        const isPasswordValid = await comparePassword(password, hashedPassword);

        if(!isPasswordValid){
            return res.status(401).json({
                message:"Invalid password"
            });
        }

         return res.status(200).json({
            message: "User logged in successfully",
            user: {
               email: user.email,
            },
        });
    }
    catch(error){
        console.error("Login error:", error);
        return res.status(500).json({
            message: "Internal server error"
        });
    }
}
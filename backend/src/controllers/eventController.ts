import { Request, Response } from "express";
import prisma from "../utils/prisma";

export async function createEvent(req: Request, res: Response) {
    try {
        const {
            title,
            description,
            startTime,
            endTime,
            category,
            type,
            registrationMode,
            maxParticipants
        } = req.body;

        if (
            !title ||
            !description ||
            !startTime ||
            !endTime ||
            !category ||
            !type ||
            !registrationMode
        ) {
            return res.status(400).json({
                message: "All required fields must be provided"
            });
        }
       
        const start = new Date(startTime);
        const end = new Date(endTime);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({
                message: "Invalid date format"
            });
        }

        if (end <= start) {
            return res.status(400).json({
                message: "End time must be after start time"
            });
        }

        const event = await prisma.event.create({
            data: {
                title,
                description,
                startTime: start,
                endTime: end,
                category,
                type,
                registrationMode,
                maxParticipants,
                organizerId: req.user!.id,
                status: "PENDING"
            }
        });
        return res.status(201).json({
            message: "Event submitted for admin approval",
            event
        });
        
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}
export async function approveEvent(req: Request, res: Response) {
    try {
        const eventId = String(req.params.eventId);

        const event = await prisma.event.findUnique({
            where: {
                id: eventId
            }
        });

        if (!event) {
            return res.status(404).json({
                message: "Event not found"
            });
        }

        if (event.status !== "PENDING") {
            return res.status(400).json({
                message: "Only pending events can be approved"
            });
        }

        const updatedEvent = await prisma.event.update({
            where: {
                id: eventId
            },
            data: {
                status: "APPROVED"
            }
        });

        return res.status(200).json({
            message: "Event approved successfully",
            event: updatedEvent
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}
export async function rejectEvent(req: Request, res: Response) {
    try {
        const eventId = String(req.params.eventId);

        const event = await prisma.event.findUnique({
            where: {
                id: eventId
            }
        });

        if (!event) {
            return res.status(404).json({
                message: "Event not found"
            });
        }

        if (event.status !== "PENDING") {
            return res.status(400).json({
                message: "Only pending events can be rejected"
            });
        }

        const updatedEvent = await prisma.event.update({
            where: {
                id: eventId
            },
            data: {
                status: "REJECTED"
            }
        });

        return res.status(200).json({
            message: "Event rejected successfully",
            event: updatedEvent
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}
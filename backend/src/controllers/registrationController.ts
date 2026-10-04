import { Request, Response } from "express";
import prisma from "../utils/prisma";
import { RegistrationStatus } from "../generated/prisma/enums";

export async function createRegistration(req: Request, res: Response) {
    try {
        const { eventId } = req.body;
        const userId = req.user.id;

        if (!eventId) {
            return res.status(400).json({
                message: "Event ID is required"
            });
        }

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

        if (event.status !== "APPROVED") {
            return res.status(400).json({
                message: "Event is not approved"
            });
        }

        const existingRegistration = await prisma.registration.findFirst({
            where: {
                eventId,
                userId
            }
        });

        if (existingRegistration) {
            return res.status(400).json({
                message: "You are already registered for this event"
            });
        }
        let registrationStatus: RegistrationStatus = RegistrationStatus.PENDING;

        if (event.registrationMode === "OPEN") {

            if (event.maxParticipants !== null) {

                const approvedCount = await prisma.registration.count({
                    where: {
                        eventId,
                        status: "APPROVED"
                    }
                });

                if (approvedCount >= event.maxParticipants) {
                    return res.status(400).json({
                        message: "Event has reached its maximum capacity"
                    });
                }
            }

            registrationStatus = RegistrationStatus.APPROVED;
        }

        const registration = await prisma.registration.create({
            data: {
                eventId,
                userId,
                status: registrationStatus
            }
        });

        return res.status(201).json(registration);

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}
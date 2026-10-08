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
export async function approveRegistration(req: Request, res: Response) {
    try {
        const { id: registrationId } = req.params as { id: string };
        const userId = req.user.id;

        if(!registrationId) {
            return res.status(400).json({
                message: "Registration ID is required"
            });
        }

        const registration = await prisma.registration.findUnique({
            where: {
                id: registrationId
            },
            include: {
                event: true
            }
        });

        if (!registration) {
            return res.status(404).json({
                message: "Registration not found"
            });
        }

        // Only the event organizer can approve registrations
        if (registration.event.organizerId !== userId) {
            return res.status(403).json({
                message: "You are not the organizer of this event"
            });
        }

        // Only pending registrations can be approved
        if (registration.status !== "PENDING") {
            return res.status(400).json({
                message: "Only pending registrations can be approved"
            });
        }

        // Check capacity
        if (registration.event.maxParticipants !== null) {
            const approvedCount = await prisma.registration.count({
                where: {
                    eventId: registration.eventId,
                    status: "APPROVED"
                }
            });

            if (approvedCount >= registration.event.maxParticipants) {
                return res.status(400).json({
                    message: "Event has reached its maximum capacity"
                });
            }
        }

        const updatedRegistration = await prisma.registration.update({
            where: {
                id: registrationId
            },
            data: {
                status: "APPROVED"
            }
        });

        return res.status(200).json({
            message: "Registration approved successfully",
            registration: updatedRegistration
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}
export async function rejectRegistration(req: Request, res: Response) {
    try {
        const { id: registrationId } = req.params as { id: string };
        const userId = req.user.id;

        if(!registrationId) {
            return res.status(400).json({
                message: "Registration ID is required"
            });
        }
        const registration = await prisma.registration.findUnique({
            where: {
                id: registrationId
            },
            include: {
                event: true
            }
            ,
        });
        if(!registration){
            return res.status(404).json({
                message: "Registration not found"
            });
        }
        if (registration.event.organizerId !== userId) {
            return res.status(403).json({
                message: "You are not the organizer of this event"
            });
        }

        if(registration.status !== "PENDING") {
            return res.status(400).json({
                message: "Only pending registrations can be rejected"
            });
        }

        const updatedRegistration = await prisma.registration.update({
            where: {
                id: registrationId
            },
            data: {
                status: "REJECTED"
            }
        });
        return res.status(200).json({
            message: "Registration rejected successfully",
            registration: updatedRegistration
        });
    }
    catch (error) {
        return res.status(500).json({
            message: "Internal server error"
        });
    }

}
export async function getMyRegistrations(req: Request, res: Response) {
    try {
        const userId = req.user.id;

        const registrations = await prisma.registration.findMany({
            where: {
                userId
            },
            include: {
                event: true
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        return res.status(200).json({
            message: "Registrations fetched successfully",
            registrations
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}
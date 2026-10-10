import { Request, Response } from "express";
import prisma from "../utils/prisma";
import { RegistrationStatus } from "../generated/prisma/enums";
import { validateFieldValue } from "../utils/registrationValidation";

export async function createRegistration(
    req: Request,
    res: Response
) {
    try {
        const { eventId, answers } = req.body;
        const userId = req.user.id;

        if (!eventId) {
            return res.status(400).json({
                message: "Event ID is required"
            });
        }

        if (answers !== undefined && !Array.isArray(answers)) {
            return res.status(400).json({
                message: "Answers must be an array"
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

        const existingRegistration =
            await prisma.registration.findFirst({
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

        /*
         * Fetch the registration form fields
         */
        const fields = await prisma.registrationField.findMany({
            where: {
                eventId
            },
            orderBy: {
                order: "asc"
            }
        });

        const submittedAnswers = answers ?? [];
        const submittedFieldIds = new Set<string>();

        for (const answer of submittedAnswers) {

            if (!answer.fieldId) {
                return res.status(400).json({
                    message: "Field ID is required for every answer"
                });
            }

            if (submittedFieldIds.has(answer.fieldId)) {
                return res.status(400).json({
                    message: `Duplicate answer for field: ${answer.fieldId}`
                });
            }

            submittedFieldIds.add(answer.fieldId);

            const field = fields.find(
                (field) => field.id === answer.fieldId
            );

            if (!field) {
                return res.status(400).json({
                    message: `Invalid field ID: ${answer.fieldId}`
                });
            }

            const error = validateFieldValue(
                field.fieldType,
                answer.value,
                field.options
            );

            if (error) {
                return res.status(400).json({
                    message: `${field.label}: ${error}`
                });
            }
        }

        /*
         * Check that every submitted field belongs
         * to this event and validate its value.
         */
        

        /*
         * Check required fields
         */
        for (const field of fields) {

            if (!field.required) {
                continue;
            }

            const answer = submittedAnswers.find(
                (answer: any) => answer.fieldId === field.id
            );

            if (
                !answer ||
                answer.value === undefined ||
                answer.value === null ||
                answer.value === "" ||
                (Array.isArray(answer.value) &&
                    answer.value.length === 0)
            ) {
                return res.status(400).json({
                    message: `Required field missing: ${field.label}`
                });
            }
        }

        let registrationStatus: RegistrationStatus =
            RegistrationStatus.PENDING;

        /*
         * OPEN registration
         */
        if (event.registrationMode === "OPEN") {

            if (event.maxParticipants !== null) {

                const approvedCount =
                    await prisma.registration.count({
                        where: {
                            eventId,
                            status: "APPROVED"
                        }
                    });

                if (approvedCount >= event.maxParticipants) {
                    return res.status(400).json({
                        message:
                            "Event has reached its maximum capacity"
                    });
                }
            }

            registrationStatus =
                RegistrationStatus.APPROVED;
        }

        /*
         * Create registration and answers
         * together.
         */
        const registration =
            await prisma.$transaction(async (tx) => {

                const newRegistration =
                    await tx.registration.create({
                        data: {
                            eventId,
                            userId,
                            status: registrationStatus
                        }
                    });

                if (submittedAnswers.length > 0) {

                    await tx.registrationAnswer.createMany({
                        data: submittedAnswers.map(
                            (answer: any) => ({
                                registrationId:
                                    newRegistration.id,
                                fieldId: answer.fieldId,
                                value: answer.value
                            })
                        )}
                    );
                }

                return newRegistration;
            });

        return res.status(201).json({
            message: "Registration created successfully",
            registration
        });

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

        if (!registrationId) {
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

        if (registration.event.organizerId !== userId) {
            return res.status(403).json({
                message: "You are not the organizer of this event"
            });
        }

        if (registration.status !== "PENDING") {
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
    } catch (error) {
        console.error(error);

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
                event: true,
                answers: {
                    include: {
                        field: true
                    },
                    orderBy: {
                        field: {
                            order: "asc"
                        }
                    }
                }
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
export async function getEventRegistrations(req: Request, res: Response) {
    try {
        const { eventId } = req.params as { eventId: string };
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

        // Only the event organizer can view registrations
        if (event.organizerId !== userId) {
            return res.status(403).json({
                message: "You are not the organizer of this event"
            });
        }

        const registrations = await prisma.registration.findMany({
            where: {
                eventId
            },
            include: {
                user: true
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        return res.status(200).json({
            message: "Event registrations fetched successfully",
            registrations
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}
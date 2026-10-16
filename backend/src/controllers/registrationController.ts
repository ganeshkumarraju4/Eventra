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
            where: { id: eventId }
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

        // Fetch registration form fields.
        const fields = await prisma.registrationField.findMany({
            where: { eventId },
            orderBy: { order: "asc" }
        });

        const submittedAnswers = answers ?? [];
        const submittedFieldIds = new Set<string>();

        // Validate submitted answers.
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
                field => field.id === answer.fieldId
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

        // Validate required fields.
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
                (
                    Array.isArray(answer.value) &&
                    answer.value.length === 0
                )
            ) {
                return res.status(400).json({
                    message: `Required field missing: ${field.label}`
                });
            }
        }

        const registration = await prisma.$transaction(
            async (tx) => {

                /*
                 * 1. Lock the event row.
                 *
                 * All operations that consume event capacity
                 * must acquire this same lock.
                 */
              const lockedEvents = await tx.$queryRaw<
                    {
                        id: string;
                        maxParticipants: number | null;
                        status: string;
                        registrationMode: string;
                    }[]
                >`
                    SELECT id, maxParticipants, status, registrationMode
                    FROM \`event\`
                    WHERE id = ${eventId}
                    FOR UPDATE
                `;

                if (lockedEvents.length === 0) {
                    throw new Error("EVENT_NOT_FOUND");
                }

                const lockedEvent = lockedEvents[0];
                if (lockedEvent.status !== "APPROVED") {
                    throw new Error("EVENT_NOT_APPROVED");
                }

                /*
                 * 2. Check for an existing registration again
                 * inside the transaction.
                 */
                const duplicate =
                    await tx.registration.findFirst({
                        where: {
                            eventId,
                            userId
                        }
                    });

                if (duplicate) {
                    throw new Error("DUPLICATE_REGISTRATION");
                }

                let registrationStatus: RegistrationStatus =
                    RegistrationStatus.PENDING;

                /*
                 * 3. OPEN registrations consume capacity
                 * immediately, so check capacity while
                 * holding the event lock.
                 */
                if (lockedEvent.registrationMode === "OPEN") {

                    if (lockedEvent.maxParticipants !== null) {

                        /*
                         * Use a locking read so the count
                         * reflects current committed data.
                         */
                        const approvedRegistrations =
                            await tx.$queryRaw<{ id: string }[]>`
                                SELECT id
                                FROM \`registration\`
                                WHERE \`eventId\` = ${eventId}
                                  AND status = 'APPROVED'
                                FOR UPDATE
                            `;

                        const approvedCount =
                            approvedRegistrations.length;

                        console.log("Open registration capacity check:", {
                            eventId,
                            approvedCount,
                            maxParticipants:
                                lockedEvent.maxParticipants
                        });

                        if (
                            approvedCount >=
                            lockedEvent.maxParticipants
                        ) {
                            throw new Error("EVENT_CAPACITY_REACHED");
                        }
                    }

                    registrationStatus =
                        RegistrationStatus.APPROVED;
                }

                /*
                 * 4. Create registration and answers in
                 * the same transaction.
                 */
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
                                registrationId: newRegistration.id,
                                fieldId: answer.fieldId,
                                value: answer.value
                            })
                        )
                    });
                }

                return newRegistration;
            }
        );

        return res.status(201).json({
            message: "Registration created successfully",
            registration
        });

    } catch (error) {

        if (error instanceof Error) {
            if (error.message === "EVENT_NOT_APPROVED") {
                return res.status(400).json({
                    message: "Event is not approved"
                });
            }

            if (error.message === "EVENT_NOT_FOUND") {
                return res.status(404).json({
                    message: "Event not found"
                });
            }

            if (error.message === "DUPLICATE_REGISTRATION") {
                return res.status(400).json({
                    message: "You are already registered for this event"
                });
            }

            if (error.message === "EVENT_CAPACITY_REACHED") {
                return res.status(400).json({
                    message: "Event has reached its maximum capacity"
                });
            }
        }

        console.error("Create registration error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}
export async function approveRegistration(req: Request, res: Response) {
    try {
        const { id: registrationId } = req.params as { id: string };
        const userId = req.user.id;

        if (!registrationId) {
            return res.status(400).json({
                message: "Registration ID is required"
            });
        }

        const result = await prisma.$transaction(async (tx) => {

            // 1. Find the registration and its event.
            const registration = await tx.registration.findUnique({
                where: {
                    id: registrationId
                },
                include: {
                    event: true
                }
            });

            if (!registration) {
                throw new Error("REGISTRATION_NOT_FOUND");
            }

            // 2. Only the event organizer can approve registrations.
            if (registration.event.organizerId !== userId) {
                throw new Error("NOT_EVENT_ORGANIZER");
            }

            // 3. Lock the event row.
           const lockedEvents = await tx.$queryRaw<
                {
                    id: string;
                    maxParticipants: number | null;
                    status: string;
                }[]
            >`
                SELECT id, maxParticipants, status
                FROM \`event\`
                WHERE id = ${registration.eventId}
                FOR UPDATE
            `;

            if (lockedEvents.length === 0) {
                throw new Error("EVENT_NOT_FOUND");
            }

            const event = lockedEvents[0];
            if (event.status !== "APPROVED") {
                throw new Error("EVENT_NOT_APPROVED");
            }

            // 4. Recheck registration status after acquiring the lock.
            const currentRegistration = await tx.registration.findUnique({
                where: {
                    id: registrationId
                }
            });

            if (!currentRegistration) {
                throw new Error("REGISTRATION_NOT_FOUND");
            }

            if (currentRegistration.status !== "PENDING") {
                throw new Error("REGISTRATION_NOT_PENDING");
            }

            // 5. Count approved registrations while holding the lock.
            if (event.maxParticipants !== null) {
               const approvedRegistrations = await tx.$queryRaw<{ id: string }[]>`
                SELECT id
                FROM \`registration\`
                WHERE \`eventId\` = ${registration.eventId}
                AND status = 'APPROVED'
                FOR UPDATE
            `;

            const approvedCount = approvedRegistrations.length;

            console.log("Capacity check:", {
                eventId: registration.eventId,
                approvedCount,
                maxParticipants: event.maxParticipants,
            });

            if (
                event.maxParticipants !== null &&
                approvedCount >= event.maxParticipants
            ) {
                throw new Error("EVENT_CAPACITY_REACHED");
            }
            }

            // 6. Approve the registration.
            return await tx.registration.update({
                where: {
                    id: registrationId
                },
                data: {
                    status: "APPROVED"
                }
            });
        });

        return res.status(200).json({
            message: "Registration approved successfully",
            registration: result
        });

    } catch (error) {
        if (error instanceof Error) {

            if (error.message === "REGISTRATION_NOT_FOUND") {
                return res.status(404).json({
                    message: "Registration not found"
                });
            }

            if (error.message === "EVENT_NOT_APPROVED") {
                return res.status(400).json({
                    message: "Registrations can only be approved for approved events"
                });
            }

            if (error.message === "NOT_EVENT_ORGANIZER") {
                return res.status(403).json({
                    message: "You are not the organizer of this event"
                });
            }

            if (error.message === "REGISTRATION_NOT_PENDING") {
                return res.status(400).json({
                    message: "Only pending registrations can be approved"
                });
            }

            if (error.message === "EVENT_CAPACITY_REACHED") {
                return res.status(400).json({
                    message: "Event has reached its maximum capacity"
                });
            }

            if (error.message === "EVENT_NOT_FOUND") {
                return res.status(404).json({
                    message: "Event not found"
                });
            }
        }

        console.error("Approve registration error:", error);

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

        const result = await prisma.$transaction(async (tx) => {
            // Find the registration and its event
            const registration = await tx.registration.findUnique({
                where: {
                    id: registrationId
                },
                include: {
                    event: true
                }
            });

            if (!registration) {
                throw new Error("REGISTRATION_NOT_FOUND");
            }

            // Verify that the requester owns the event
            if (registration.event.organizerId !== userId) {
                throw new Error("NOT_EVENT_ORGANIZER");
            }

            // Lock the event row to coordinate status changes
            await tx.$queryRaw`
                SELECT id FROM event
                WHERE id = ${registration.eventId}
                FOR UPDATE
            `;

            // Atomically transition only a PENDING registration
            const updated = await tx.registration.updateMany({
                where: {
                    id: registrationId,
                    status: "PENDING"
                },
                data: {
                    status: "REJECTED"
                }
            });

            if (updated.count === 0) {
                throw new Error("REGISTRATION_NOT_PENDING");
            }

            return await tx.registration.findUnique({
                where: {
                    id: registrationId
                }
            });
        });

        return res.status(200).json({
            message: "Registration rejected successfully",
            registration: result
        });

    } catch (error) {
        if (error instanceof Error) {
            if (error.message === "REGISTRATION_NOT_FOUND") {
                return res.status(404).json({
                    message: "Registration not found"
                });
            }

            if (error.message === "NOT_EVENT_ORGANIZER") {
                return res.status(403).json({
                    message: "You are not the organizer of this event"
                });
            }

            if (error.message === "REGISTRATION_NOT_PENDING") {
                return res.status(400).json({
                    message: "Only pending registrations can be rejected"
                });
            }
        }

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
                userId,
                event: {
                    OR: [
                        { type: "PUBLIC" },
                        { organizerId: userId }
                    ]
                }
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
        const userRole = req.user.role;

        if (!eventId|| eventId.trim() === "") {
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
       if (
            event.organizerId !== userId &&
            userRole !== "ADMIN"
        ) {
            return res.status(403).json({
                message: "Only the event organizer or an admin can view registrations"
            });
        }

        const registrations = await prisma.registration.findMany({
            where: {
                eventId
            },
            include: {
                 user: {
            select: {
                id: true,
                name: true,
                email: true
            }
        }
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

export async function updateRegistration(
    req: Request,
    res: Response
) {
    try {
        const registrationId = String(req.params.registrationId);
        const userId = req.user.id;
        const { answers } = req.body;

        // 1. Validate request body
        if (!Array.isArray(answers)) {
            return res.status(400).json({
                message: "Answers must be an array"
            });
        }

        // 2. Find the registration
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

        // 3. Only the participant can update their registration
        if (registration.userId !== userId) {
            return res.status(403).json({
                message: "You cannot update another user's registration"
            });
        }

        // 4. Only active registrations can be updated
        if (
            registration.status === "REJECTED" ||
            registration.status === "CANCELLED"
        ) {
            return res.status(400).json({
                message: "This registration cannot be updated"
            });
        }

        // 5. Fetch the event's current registration fields
        const fields = await prisma.registrationField.findMany({
            where: {
                eventId: registration.eventId
            }
        });

        const submittedFieldIds = new Set<string>();

        // 6. Validate submitted answers
        for (const answer of answers) {
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

        // 7. Load previously submitted answers
        const existingAnswers =
            await prisma.registrationAnswer.findMany({
                where: {
                    registrationId
                }
            });

        // 8. Merge existing answers with submitted changes
        const finalAnswers = new Map<string, unknown>();

        for (const answer of existingAnswers) {
            finalAnswers.set(answer.fieldId, answer.value);
        }

        for (const answer of answers) {
            finalAnswers.set(answer.fieldId, answer.value);
        }

        // 9. Check every required field against the final answers
        for (const field of fields) {
            if (!field.required) {
                continue;
            }

            const value = finalAnswers.get(field.id);

            if (
                value === undefined ||
                value === null ||
                value === "" ||
                (Array.isArray(value) && value.length === 0)
            ) {
                return res.status(400).json({
                    message: `Required field missing: ${field.label}`
                });
            }
        }

        
        // 10. Update answers atomically after rechecking registration status
const updatedRegistration = await prisma.$transaction(async (tx) => {

    // Lock the event row first.
    // This coordinates with cancellation and other registration operations
    // that use the same event-row locking convention.
    const lockedEvents = await tx.$queryRaw<{ id: string }[]>`
    SELECT id
    FROM \`event\`
    WHERE id = ${registration.eventId}
    FOR UPDATE
`;

if (lockedEvents.length === 0) {
    throw new Error("EVENT_NOT_FOUND");
}

    // Lock and re-read the registration after acquiring the event lock.
    const currentRegistration = await tx.$queryRaw<
        Array<{
            id: string;
            userId: string;
            status: string;
        }>
    >`
        SELECT id, userId, status
        FROM registration
        WHERE id = ${registrationId}
        FOR UPDATE
    `;

    if (currentRegistration.length === 0) {
        throw new Error("REGISTRATION_NOT_FOUND");
    }

    const current = currentRegistration[0];

    // Recheck ownership inside the transaction.
    if (current.userId !== userId) {
        throw new Error("NOT_REGISTRATION_OWNER");
    }

    // Recheck status inside the transaction.
    if (
        current.status === "REJECTED" ||
        current.status === "CANCELLED"
    ) {
        throw new Error("REGISTRATION_NOT_UPDATABLE");
    }

    // Update existing answers or create new ones.
    for (const answer of answers) {
        await tx.registrationAnswer.upsert({
            where: {
                registrationId_fieldId: {
                    registrationId,
                    fieldId: answer.fieldId
                }
            },
            update: {
                value: answer.value
            },
            create: {
                registrationId,
                fieldId: answer.fieldId,
                value: answer.value
            }
        });
    }

    return tx.registration.findUnique({
        where: {
            id: registrationId
        },
        include: {
            event: true,
            answers: {
                include: {
                    field: true
                }
            }
        }
    });
});
        return res.status(200).json({
            message: "Registration updated successfully",
            registration: updatedRegistration
        });
} catch (error) {
    if (error instanceof Error) {
        if (error.message === "REGISTRATION_NOT_FOUND") {
            return res.status(404).json({
                message: "Registration not found"
            });
        }

        if (error.message === "NOT_REGISTRATION_OWNER") {
            return res.status(403).json({
                message: "You cannot update another user's registration"
            });
        }

        if (error.message === "REGISTRATION_NOT_UPDATABLE") {
            return res.status(400).json({
                message: "This registration cannot be updated"
            });
        }
    }

    console.error(error);

    return res.status(500).json({
        message: "Internal server error"
    });
}
}

export async function cancelRegistration(
    req: Request,
    res: Response
) {
    try {
        const registrationId = String(req.params.registrationId);
        const userId = req.user.id;

        if (!registrationId || registrationId === "undefined") {
            return res.status(400).json({
                message: "Registration ID is required"
            });
        }

        const cancelledRegistration = await prisma.$transaction(
            async (tx) => {

                // 1. Find the registration and its event.
                const registration =
                    await tx.registration.findUnique({
                        where: {
                            id: registrationId
                        },
                        include: {
                            event: true
                        }
                    });

                if (!registration) {
                    throw new Error("REGISTRATION_NOT_FOUND");
                }

                // 2. Verify ownership.
                if (registration.userId !== userId) {
                    throw new Error("NOT_REGISTRATION_OWNER");
                }

                // 3. Lock the event row.
                const lockedEvents = await tx.$queryRaw<{ id: string }[]>`
                    SELECT id
                    FROM \`event\`
                    WHERE id = ${registration.eventId}
                    FOR UPDATE
                `;

                if (lockedEvents.length === 0) {
                    throw new Error("EVENT_NOT_FOUND");
                }

                // 4. Re-read the registration after acquiring
                // the event lock.
                const currentRegistrations = await tx.$queryRaw<
                        { id: string; userId: string; status: string }[]
                    >`
                        SELECT id, userId, status
                        FROM \`registration\`
                        WHERE id = ${registrationId}
                        FOR UPDATE
                    `;

                    if (currentRegistrations.length === 0) {
                        throw new Error("REGISTRATION_NOT_FOUND");
                    }

                const currentRegistration = currentRegistrations[0];

                if (!currentRegistration) {
                    throw new Error("REGISTRATION_NOT_FOUND");
                }

                if (
                    currentRegistration.status === "CANCELLED" ||
                    currentRegistration.status === "REJECTED"
                ) {
                    throw new Error(
                        `CANNOT_CANCEL_${currentRegistration.status}`
                    );
                }

                // 5. Cancel within the same transaction.
                return await tx.registration.update({
                    where: {
                        id: registrationId
                    },
                    data: {
                        status: "CANCELLED"
                    }
                });
            }
        );

        return res.status(200).json({
            message: "Registration cancelled successfully",
            registration: cancelledRegistration
        });

    } catch (error) {

        if (error instanceof Error) {

            if (error.message === "REGISTRATION_NOT_FOUND") {
                return res.status(404).json({
                    message: "Registration not found"
                });
            }

            if (error.message === "NOT_REGISTRATION_OWNER") {
                return res.status(403).json({
                    message: "You cannot cancel another user's registration"
                });
            }

            if (error.message === "CANNOT_CANCEL_CANCELLED") {
                return res.status(400).json({
                    message: "Cannot cancel a cancelled registration"
                });
            }

            if (error.message === "CANNOT_CANCEL_REJECTED") {
                return res.status(400).json({
                    message: "Cannot cancel a rejected registration"
                });
            }
        }

        console.error("Cancel registration error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}
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
            maxParticipants,
            venueId
        } = req.body;

        if (
            !title ||
            !description ||
            !startTime ||
            !endTime ||
            !category ||
            !type ||
            !registrationMode ||
            !venueId
        ) {
            return res.status(400).json({
                message: "All required fields must be provided"
            });
        }

        if (type !== "PUBLIC" && type !== "PRIVATE") {
            return res.status(400).json({
                message: "Type must be either PUBLIC or PRIVATE"
            });
        }
        if (
            registrationMode !== "OPEN" &&
            registrationMode !== "APPROVAL_REQUIRED"
        ) {
            return res.status(400).json({
                message: "Invalid registration mode"
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

        const result = await prisma.$transaction(async (tx) => {
            // 1. Lock the venue row until this transaction finishes.
            const lockedVenue = await tx.$queryRaw<
                { id: string; capacity: number }[]
            >`
                SELECT id, capacity
                FROM Venue
                WHERE id = ${venueId}
                FOR UPDATE
            `;

            if (lockedVenue.length === 0) {
                throw new Error("VENUE_NOT_FOUND");
            }

            const venue = lockedVenue[0];

            // 2. Validate participant limits using the locked venue.
            if (
                maxParticipants !== undefined &&
                maxParticipants !== null &&
                (
                    typeof maxParticipants !== "number" ||
                    !Number.isInteger(maxParticipants) ||
                    maxParticipants <= 0
                )
            ) {
                throw new Error("INVALID_MAX_PARTICIPANTS");
            }

            if (
                maxParticipants !== undefined &&
                maxParticipants !== null &&
                maxParticipants > venue.capacity
            ) {
                throw new Error("CAPACITY_EXCEEDED");
            }

            // 3. Check availability while holding the venue lock.
            const conflictingBooking = await tx.booking.findFirst({
                where: {
                    venueId,
                    startTime: {
                        lt: end
                    },
                    endTime: {
                        gt: start
                    }
                }
            });

            if (conflictingBooking) {
                throw new Error("VENUE_TIME_CONFLICT");
            }

            // 4. Create the event and booking atomically.
            const event = await tx.event.create({
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

            const booking = await tx.booking.create({
                data: {
                    eventId: event.id,
                    venueId,
                    startTime: start,
                    endTime: end
                }
            });

            return { event, booking };
        });

        return res.status(201).json({
            message: "Event submitted for admin approval",
            event: result.event,
            booking: result.booking
        });

    } catch (error) {
        if (error instanceof Error) {
            if (error.message === "VENUE_NOT_FOUND") {
                return res.status(404).json({
                    message: "Venue not found"
                });
            }

            if (error.message === "INVALID_MAX_PARTICIPANTS") {
                return res.status(400).json({
                    message: "Maximum participants must be a positive integer"
                });
            }

            if (error.message === "CAPACITY_EXCEEDED") {
                return res.status(400).json({
                    message: "Maximum participants cannot exceed venue capacity"
                });
            }

            if (error.message === "VENUE_TIME_CONFLICT") {
                return res.status(409).json({
                    message: "The venue is already booked for the selected time slot"
                });
            }
        }

        console.error("Create event error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}
export async function approveEvent(req: Request, res: Response) {
    try {
        const eventId = String(req.params.eventId);

        const result = await prisma.event.updateMany({
            where: {
                id: eventId,
                status: "PENDING"
            },
            data: {
                status: "APPROVED"
            }
        });

        if (result.count === 0) {
            const event = await prisma.event.findUnique({
                where: { id: eventId },
                select: {
                    id: true,
                    status: true
                }
            });

            if (!event) {
                return res.status(404).json({
                    message: "Event not found"
                });
            }

            return res.status(400).json({
                message: "Only pending events can be approved"
            });
        }

        const updatedEvent = await prisma.event.findUnique({
            where: { id: eventId }
        });

        return res.status(200).json({
            message: "Event approved successfully",
            event: updatedEvent
        });

    } catch (error) {
        console.error("Approve event error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}

export async function rejectEvent(req: Request, res: Response) {
    try {
        const eventId = String(req.params.eventId);

        // Reject only if the event is still pending.
        const result = await prisma.event.updateMany({
            where: {
                id: eventId,
                status: "PENDING"
            },
            data: {
                status: "REJECTED"
            }
        });

        // No rows updated means the event doesn't exist
        // or it is no longer pending.
        if (result.count === 0) {
            const event = await prisma.event.findUnique({
                where: { id: eventId },
                select: {
                    id: true,
                    status: true
                }
            });

            if (!event) {
                return res.status(404).json({
                    message: "Event not found"
                });
            }

            return res.status(400).json({
                message: "Only pending events can be rejected"
            });
        }

        const updatedEvent = await prisma.event.findUnique({
            where: { id: eventId }
        });

        return res.status(200).json({
            message: "Event rejected successfully",
            event: updatedEvent
        });

    } catch (error) {
        console.error("Reject event error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}



export async function getApprovedEvents(req: Request, res: Response) {
    try {
        const events = await prisma.event.findMany({
            where: {
                status: "APPROVED",
                type: "PUBLIC"
            },
            orderBy: {
                startTime: "asc"
            }
        });
        return res.status(200).json({
            message: "Approved events fetched successfully",
            events
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Failed to fetch approved events"
        });
    }
}

export async function getEvent(req: Request, res: Response) {
    try {
        const eventId = String(req.params.eventId);
        const userId = req.user!.id;
        const userRole = req.user!.role;

        if (!eventId || eventId === "undefined") {
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

        // Private events are visible only to their organizer and admins.
        if (
            event.type === "PRIVATE" &&
            event.organizerId !== userId &&
            userRole !== "ADMIN"
        ) {
            return res.status(403).json({
                message: "You are not authorized to view this private event"
            });
        }

        return res.status(200).json({
            message: "Event fetched successfully",
            event
        });
    } catch (error) {
        console.error("Get event error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}


export async function updateEvent(req: Request, res: Response) {
    try {
        const eventId = String(req.params.eventId);
        const userId = req.user!.id;

        const {
            title,
            description,
            category,
            maxParticipants
        } = req.body;

        // Validate that at least one editable field was supplied.
        if (
            title === undefined &&
            description === undefined &&
            category === undefined &&
            maxParticipants === undefined
        ) {
            return res.status(400).json({
                message: "At least one field must be provided for update"
            });
        }

        // Validate title.
        if (
            title !== undefined &&
            (typeof title !== "string" || title.trim().length === 0)
        ) {
            return res.status(400).json({
                message: "Title must be a non-empty string"
            });
        }

        // Validate description.
        if (
            description !== undefined &&
            (
                typeof description !== "string" ||
                description.trim().length === 0
            )
        ) {
            return res.status(400).json({
                message: "Description must be a non-empty string"
            });
        }

        // Validate category.
        const allowedCategories = [
            "CONFERENCE",
            "WORKSHOP",
            "SEMINAR",
            "CONCERT",
            "SPORTS",
            "TECHNICAL",
            "OTHER"
        ];

        if (
            category !== undefined &&
            (
                typeof category !== "string" ||
                !allowedCategories.includes(category)
            )
        ) {
            return res.status(400).json({
                message: "Invalid event category"
            });
        }

        // Validate capacity. null means unlimited capacity.
        if (
            maxParticipants !== undefined &&
            maxParticipants !== null &&
            (
                typeof maxParticipants !== "number" ||
                !Number.isSafeInteger(maxParticipants) ||
                maxParticipants < 1
            )
        ) {
            return res.status(400).json({
                message: "Maximum participants must be a positive integer or null"
            });
        }

        // Find the event.
        const event = await prisma.event.findUnique({
            where: { id: eventId }
        });

        if (!event) {
            return res.status(404).json({
                message: "Event not found"
            });
        }

        // Verify event ownership.
        if (event.organizerId !== userId) {
            return res.status(403).json({
                message: "You are not authorized to update this event"
            });
        }

        // Reject updates to rejected events.
        if (event.status === "REJECTED") {
            return res.status(400).json({
                message: "Rejected events cannot be updated"
            });
        }
         if (event.status === "CANCELLED") {
            return res.status(400).json({
                message: "Cancelled events cannot be updated"
            });
        }

        const updatedEvent = await prisma.$transaction(async (tx) => {

            // Lock the event row to serialize capacity changes
            // with registration operations that use the same lock.
            const lockedEvents = await tx.$queryRaw<
                {
                    id: string;
                    maxParticipants: number | null;
                    organizerId: string;
                    status: string;
                }[]
            >`
                SELECT id, maxParticipants, organizerId, status
                FROM \`event\`
                WHERE id = ${eventId}
                FOR UPDATE
            `;

            if (lockedEvents.length === 0) {
                throw new Error("EVENT_NOT_FOUND");
            }

            const lockedEvent = lockedEvents[0];

            if (lockedEvent.organizerId !== userId) {
                throw new Error("NOT_EVENT_ORGANIZER");
            }

            if (
                lockedEvent.status === "CANCELLED" ||
                lockedEvent.status === "REJECTED"
            ) {
                throw new Error("EVENT_NOT_UPDATABLE");
            }

            // Check capacity using a current locking read.
            if (
                maxParticipants !== undefined &&
                maxParticipants !== null
            ) {
                const approvedRegistrations =
                    await tx.$queryRaw<{ id: string }[]>`
                        SELECT id
                        FROM \`registration\`
                        WHERE \`eventId\` = ${eventId}
                          AND status = 'APPROVED'
                        FOR UPDATE
                    `;

                const approvedCount = approvedRegistrations.length;

                if (maxParticipants < approvedCount) {
                    throw new Error("CAPACITY_BELOW_APPROVED_COUNT");
                }
            }

            // Update only explicitly supplied fields.
            return await tx.event.update({
                where: { id: eventId },
                data: {
                    ...(title !== undefined && {
                        title: title.trim()
                    }),
                    ...(description !== undefined && {
                        description: description.trim()
                    }),
                    ...(category !== undefined && {
                        category
                    }),
                    ...(maxParticipants !== undefined && {
                        maxParticipants
                    })
                }
            });
        });

        return res.status(200).json({
            message: "Event updated successfully",
            event: updatedEvent
        });

    } catch (error) {

        if (error instanceof Error) {
            if (error.message === "EVENT_NOT_FOUND") {
                return res.status(404).json({
                    message: "Event not found"
                });
            }
            if (error.message === "NOT_EVENT_ORGANIZER") {
                return res.status(403).json({
                    message: "You are not authorized to update this event"
                });
            }

            if (error.message === "EVENT_NOT_UPDATABLE") {
                return res.status(400).json({
                    message: "Cancelled or rejected events cannot be updated"
                });
            }

            if (error.message === "CAPACITY_BELOW_APPROVED_COUNT") {
                return res.status(400).json({
                    message: "Maximum participants cannot be less than the number of approved registrations"
                });
            }
        }

        console.error("Update event error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}
export async function cancelEvent(req: Request, res: Response) {
    try {
        const eventId = String(req.params.eventId);
        const userId = req.user!.id;

        const result = await prisma.$transaction(async (tx) => {
            // 1. Lock the event row first.
            const lockedEvents = await tx.$queryRaw<
                {
                    id: string;
                    organizerId: string;
                    status: string;
                }[]
            >`
                SELECT id, organizerId, status
                FROM event
                WHERE id = ${eventId}
                FOR UPDATE
            `;

            const event = lockedEvents[0];

            if (!event) {
                throw new Error("EVENT_NOT_FOUND");
            }

            // 2. Verify organizer ownership using the locked row.
            if (event.organizerId !== userId) {
                throw new Error("NOT_EVENT_ORGANIZER");
            }

            // 3. Recheck status after acquiring the lock.
            if (event.status === "CANCELLED") {
                throw new Error("EVENT_ALREADY_CANCELLED");
            }

            if (event.status === "REJECTED") {
                throw new Error("EVENT_REJECTED");
            }

            // 4. Find the event's current booking.
            const booking = await tx.booking.findUnique({
                where: { eventId }
            });

            // 5. Lock the venue before modifying its booking.
            if (booking) {
                await tx.$queryRaw<{ id: string }[]>`
                    SELECT id
                    FROM Venue
                    WHERE id = ${booking.venueId}
                    FOR UPDATE
                `;
            }

            // 6. Cancel the event.
            const updatedEvent = await tx.event.update({
                where: { id: eventId },
                data: {
                    status: "CANCELLED"
                }
            });

            // 7. Cancel pending and approved registrations.
            const registrations = await tx.registration.updateMany({
                where: {
                    eventId,
                    status: {
                        in: ["PENDING", "APPROVED"]
                    }
                },
                data: {
                    status: "CANCELLED"
                }
            });

            // 8. Release the event's booking.
            const deletedBookings = await tx.booking.deleteMany({
                where: { eventId }
            });

            // 9. Reject pending change requests.
            const rejectedRequests =
                await tx.eventChangeRequest.updateMany({
                    where: {
                        eventId,
                        status: "PENDING"
                    },
                    data: {
                        status: "REJECTED",
                        reviewComment:
                            "Event was cancelled by the organizer.",
                        reviewedAt: new Date()
                    }
                });

            return {
                event: updatedEvent,
                cancelledRegistrations: registrations.count,
                releasedBookings: deletedBookings.count,
                rejectedRequests: rejectedRequests.count
            };
        });

        return res.status(200).json({
            message: "Event cancelled successfully",
            ...result
        });

    } catch (error) {
        if (error instanceof Error) {
            switch (error.message) {
                case "EVENT_NOT_FOUND":
                    return res.status(404).json({
                        message: "Event not found"
                    });

                case "NOT_EVENT_ORGANIZER":
                    return res.status(403).json({
                        message: "Only the event organizer can cancel this event"
                    });

                case "EVENT_ALREADY_CANCELLED":
                    return res.status(400).json({
                        message: "Event is already cancelled"
                    });

                case "EVENT_REJECTED":
                    return res.status(400).json({
                        message: "Rejected events cannot be cancelled"
                    });
            }
        }

        console.error("Cancel event error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}
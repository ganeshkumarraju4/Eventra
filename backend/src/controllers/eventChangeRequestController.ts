import { Request, Response } from "express";
import prisma from "../utils/prisma";

export async function createEventChangeRequest(
    req: Request,
    res: Response
) {
    try {
        const eventId = req.params.eventId;
        const userId = req.user.id;

        const {
            startTime,
            endTime,
            venueId,
            reason
        } = req.body;

        // 1. Validate required fields
        if (
            typeof eventId !== "string" ||
            eventId.trim() === "" ||
            !startTime ||
            !endTime ||
            typeof venueId !== "string" ||
            venueId.trim() === ""
        ) {
            return res.status(400).json({
                message: "Event ID, start time, end time, and venue ID are required"
            });
        }

        // 2. Validate dates
        const start = new Date(startTime);
        const end = new Date(endTime);

        if (
            Number.isNaN(start.getTime()) ||
            Number.isNaN(end.getTime())
        ) {
            return res.status(400).json({
                message: "Invalid date format"
            });
        }

        if (end <= start) {
            return res.status(400).json({
                message: "End time must be after start time"
            });
        }

        // 3. Validate reason
        if (
            reason !== undefined &&
            reason !== null &&
            (typeof reason !== "string" || reason.length > 1000)
        ) {
            return res.status(400).json({
                message: "Reason must be a string of at most 1000 characters"
            });
        }

        const changeRequest = await prisma.$transaction(
            async (tx) => {

                // 4. Lock the event row.
                // Concurrent requests for this event must wait here.
                const lockedEvents = await tx.$queryRaw<
                    { id: string; organizerId: string; status: string }[]
                >`
                    SELECT id, organizerId, status
                    FROM event
                    WHERE id = ${eventId}
                    FOR UPDATE
                `;

                const lockedEvent = lockedEvents[0];

                if (!lockedEvent) {
                    throw new Error("EVENT_NOT_FOUND");
                }

                // 5. Verify ownership inside the transaction
                if (lockedEvent.organizerId !== userId) {
                    throw new Error("NOT_EVENT_ORGANIZER");
                }

                // 6. Verify event status inside the transaction
                if (lockedEvent.status !== "APPROVED") {
                    throw new Error("EVENT_NOT_APPROVED");
                }

                // 7. Verify the booking still exists
                const booking = await tx.booking.findUnique({
                    where: {
                        eventId
                    }
                });

                if (!booking) {
                    throw new Error("BOOKING_NOT_FOUND");
                }

                // 8. Verify the requested venue exists and check capacity
                const venue = await tx.venue.findUnique({
                    where: {
                        id: venueId
                    }
                });

                if (!venue) {
                    throw new Error("VENUE_NOT_FOUND");
                }

                const event = await tx.event.findUnique({
                    where: {
                        id: eventId
                    },
                    select: {
                        maxParticipants: true
                    }
                });

                if (!event) {
                    throw new Error("EVENT_NOT_FOUND");
                }

                if (
                    event.maxParticipants !== null &&
                    event.maxParticipants > venue.capacity
                ) {
                    throw new Error("CAPACITY_EXCEEDED");
                }

                // 9. Check for an existing pending request
                const pendingRequest =
                    await tx.eventChangeRequest.findFirst({
                        where: {
                            eventId,
                            status: "PENDING"
                        },
                        select: {
                            id: true
                        }
                    });

                if (pendingRequest) {
                    throw new Error("PENDING_REQUEST_EXISTS");
                }

                // 10. Create the request in the same transaction
                return await tx.eventChangeRequest.create({
                    data: {
                        eventId,
                        requestedById: userId,
                        requestedStartTime: start,
                        requestedEndTime: end,
                        requestedVenueId: venueId,
                        reason: reason ?? null
                    }
                });
            }
        );

        return res.status(201).json({
            message: "Event change request submitted successfully",
            changeRequest
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
                        message: "Only the event organizer can request changes"
                    });

                case "EVENT_NOT_APPROVED":
                    return res.status(400).json({
                        message: "Only approved events can request date or venue changes"
                    });

                case "BOOKING_NOT_FOUND":
                    return res.status(400).json({
                        message: "Event does not have a venue booking"
                    });

                case "VENUE_NOT_FOUND":
                    return res.status(404).json({
                        message: "Requested venue not found"
                    });

                case "CAPACITY_EXCEEDED":
                    return res.status(400).json({
                        message: "Event participant limit exceeds the requested venue capacity"
                    });

                case "PENDING_REQUEST_EXISTS":
                    return res.status(409).json({
                        message: "This event already has a pending change request"
                    });
            }
        }

        console.error(error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}
export async function getMyEventChangeRequests(
    req: Request,
    res: Response
) {
    try {
       const eventId = req.params.eventId;

        if (
            typeof eventId !== "string" ||
            eventId.trim() === ""
        ) {
            return res.status(400).json({
                message: "Event ID is required"
            });
        }
        const userId = req.user.id;

        const event = await prisma.event.findUnique({
            where: { id: eventId }
        });

        if (!event) {
            return res.status(404).json({
                message: "Event not found"
            });
        }

        if (event.organizerId !== userId) {
            return res.status(403).json({
                message: "Only the event organizer can view these requests"
            });
        }

        const requests = await prisma.eventChangeRequest.findMany({
            where: {
                eventId,
                requestedById: userId
            },
            include: {
                requestedVenue: true
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        return res.status(200).json({
            message: "Event change requests fetched successfully",
            requests
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}
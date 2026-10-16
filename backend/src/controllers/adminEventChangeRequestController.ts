import { Request, Response } from "express";
import prisma from "../utils/prisma";

export async function getPendingEventChangeRequests(
    req: Request,
    res: Response
) {
    try {
        const requests = await prisma.eventChangeRequest.findMany({
            where: {
                status: "PENDING"
            },
            include: {
                event: true,
                requestedBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                requestedVenue: true
            },
            orderBy: {
                createdAt: "asc"
            }
        });

        return res.status(200).json({
            message: "Pending event change requests fetched successfully",
            requests
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}
export async function approveEventChangeRequest(
    req: Request,
    res: Response
) {
    try {
        const requestId = String(req.params.requestId);
        const adminId = req.user.id;
        const { reviewComment } = req.body;
        if (
            reviewComment !== undefined &&
            reviewComment !== null &&
            (
                typeof reviewComment !== "string" ||
                reviewComment.length > 1000
            )
        ) {
            return res.status(400).json({
                message: "Review comment must be a string of at most 1000 characters"
            });
        }
        const result = await prisma.$transaction(async (tx) => {
            // 1. Read the request to identify the event.
            const initialRequest =
                await tx.eventChangeRequest.findUnique({
                    where: { id: requestId },
                    include: {
                        event: {
                            include: {
                                booking: true
                            }
                        }
                    }
                });

            if (!initialRequest) {
                throw new Error("CHANGE_REQUEST_NOT_FOUND");
            }

            // 2. Lock the existing event first.
            const lockedEvents = await tx.$queryRaw<
                {
                    id: string;
                    organizerId: string;
                    status: string;
                    maxParticipants: number | null;
                }[]
            >`
                SELECT id, organizerId, status, maxParticipants
                FROM event
                WHERE id = ${initialRequest.eventId}
                FOR UPDATE
            `;

            const event = lockedEvents[0];

            if (!event) {
                throw new Error("EVENT_NOT_FOUND");
            }

            if (event.status !== "APPROVED") {
                throw new Error("EVENT_NOT_APPROVED");
            }

            // 3. Lock the change request and recheck its state.
            const lockedRequests = await tx.$queryRaw<
                {
                    id: string;
                    eventId: string;
                    requestedVenueId: string;
                    requestedStartTime: Date;
                    requestedEndTime: Date;
                    status: string;
                }[]
            >`
                SELECT
                    id,
                    eventId,
                    requestedVenueId,
                    requestedStartTime,
                    requestedEndTime,
                    status
                FROM EventChangeRequest
                WHERE id = ${requestId}
                FOR UPDATE
            `;

            const changeRequest = lockedRequests[0];

            if (!changeRequest) {
                throw new Error("CHANGE_REQUEST_NOT_FOUND");
            }

            if (changeRequest.eventId !== event.id) {
                throw new Error("CHANGE_REQUEST_EVENT_MISMATCH");
            }

            if (changeRequest.status !== "PENDING") {
                throw new Error("CHANGE_REQUEST_ALREADY_REVIEWED");
            }

            // 4. Retrieve the current booking.
            const booking = await tx.booking.findUnique({
                where: { eventId: event.id }
            });

            if (!booking) {
                throw new Error("EVENT_BOOKING_NOT_FOUND");
            }

            // 5. Lock both venues in deterministic ID order.
            const venueIds = [
                booking.venueId,
                changeRequest.requestedVenueId
            ];

            const sortedVenueIds = [...new Set(venueIds)].sort();

            const lockedVenues: {
                id: string;
                capacity: number;
            }[] = [];

            for (const venueId of sortedVenueIds) {
                const venues = await tx.$queryRaw<
                    { id: string; capacity: number }[]
                >`
                    SELECT id, capacity
                    FROM Venue
                    WHERE id = ${venueId}
                    FOR UPDATE
                `;

                if (venues.length === 0) {
                    if (venueId === changeRequest.requestedVenueId) {
                        throw new Error("REQUESTED_VENUE_NOT_FOUND");
                    }

                    throw new Error("CURRENT_VENUE_NOT_FOUND");
                }

                lockedVenues.push(venues[0]);
            }

            const requestedVenue = lockedVenues.find(
                venue => venue.id === changeRequest.requestedVenueId
            );

            if (!requestedVenue) {
                throw new Error("REQUESTED_VENUE_NOT_FOUND");
            }

            // 6. Check the current participant limit.
            if (
                event.maxParticipants !== null &&
                event.maxParticipants > requestedVenue.capacity
            ) {
                throw new Error("VENUE_CAPACITY_EXCEEDED");
            }

            // 7. Check overlapping bookings while holding the venue lock.
            const conflictingBooking = await tx.booking.findFirst({
                where: {
                    venueId: changeRequest.requestedVenueId,
                    eventId: {
                        not: event.id
                    },
                    startTime: {
                        lt: changeRequest.requestedEndTime
                    },
                    endTime: {
                        gt: changeRequest.requestedStartTime
                    }
                }
            });

            if (conflictingBooking) {
                throw new Error("VENUE_TIME_CONFLICT");
            }

            // 8. Update the event.
            const updatedEvent = await tx.event.update({
                where: { id: event.id },
                data: {
                    startTime: changeRequest.requestedStartTime,
                    endTime: changeRequest.requestedEndTime
                }
            });

            // 9. Update the booking.
            await tx.booking.update({
                where: { eventId: event.id },
                data: {
                    venueId: changeRequest.requestedVenueId,
                    startTime: changeRequest.requestedStartTime,
                    endTime: changeRequest.requestedEndTime
                }
            });

            // 10. Mark the change request as approved.
            const updatedRequest =
                await tx.eventChangeRequest.update({
                    where: { id: requestId },
                    data: {
                        status: "APPROVED",
                        reviewedById: adminId,
                        reviewedAt: new Date(),
                        reviewComment: reviewComment ?? null
                    }
                });

            return {
                updatedEvent,
                updatedRequest
            };
        });

        return res.status(200).json({
            message: "Event change request approved successfully",
            event: result.updatedEvent,
            changeRequest: result.updatedRequest
        });

    } catch (error) {
        if (error instanceof Error) {
            switch (error.message) {
                case "CHANGE_REQUEST_NOT_FOUND":
                case "EVENT_NOT_FOUND":
                    return res.status(404).json({
                        message: "Event or change request not found"
                    });

                case "EVENT_NOT_APPROVED":
                    return res.status(400).json({
                        message: "Only approved events can have their changes applied"
                    });

                case "CHANGE_REQUEST_ALREADY_REVIEWED":
                    return res.status(400).json({
                        message: "This change request has already been reviewed"
                    });

                case "CHANGE_REQUEST_EVENT_MISMATCH":
                    return res.status(400).json({
                        message: "Change request does not belong to the event"
                    });

                case "EVENT_BOOKING_NOT_FOUND":
                    return res.status(400).json({
                        message: "Event booking not found"
                    });

                case "REQUESTED_VENUE_NOT_FOUND":
                case "CURRENT_VENUE_NOT_FOUND":
                    return res.status(404).json({
                        message: "Venue not found"
                    });

                case "VENUE_TIME_CONFLICT":
                    return res.status(409).json({
                        message: "The requested venue is already booked during this time"
                    });

                case "VENUE_CAPACITY_EXCEEDED":
                    return res.status(400).json({
                        message: "Event participant limit exceeds the requested venue capacity"
                    });
            }
        }

        console.error("Approve event change request error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}

export async function rejectEventChangeRequest(
    req: Request,
    res: Response
) {
    try {
        const requestId = req.params.requestId;

        if (
            typeof requestId !== "string" ||
            requestId.trim() === ""
        ) {
            return res.status(400).json({
                message: "Invalid change request ID"
            });
        }
        const adminId = req.user.id;
        const { reviewComment } = req.body ?? {};
        if (
            reviewComment !== undefined &&
            reviewComment !== null &&
            (
                typeof reviewComment !== "string" ||
                reviewComment.length > 1000
            )
        ) {
            return res.status(400).json({
                message: "Review comment must be a string of at most 1000 characters"
            });
        }
        const result = await prisma.$transaction(async (tx) => {
            // 1. Read the request to identify its event.
            const initialRequest =
                await tx.eventChangeRequest.findUnique({
                    where: { id: requestId },
                    select: {
                        id: true,
                        eventId: true
                    }
                });

            if (!initialRequest) {
                throw new Error("CHANGE_REQUEST_NOT_FOUND");
            }

            // 2. Lock the event first.
            const lockedEvents = await tx.$queryRaw<
                {
                    id: string;
                    status: string;
                }[]
            >`
                SELECT id, status
                FROM event
                WHERE id = ${initialRequest.eventId}
                FOR UPDATE
            `;

            const event = lockedEvents[0];

            if (!event) {
                throw new Error("EVENT_NOT_FOUND");
            }

            // 3. Lock and recheck the change request.
            const lockedRequests = await tx.$queryRaw<
                {
                    id: string;
                    eventId: string;
                    status: string;
                }[]
            >`
                SELECT id, eventId, status
                FROM EventChangeRequest
                WHERE id = ${requestId}
                FOR UPDATE
            `;

            const changeRequest = lockedRequests[0];

            if (!changeRequest) {
                throw new Error("CHANGE_REQUEST_NOT_FOUND");
            }

            if (changeRequest.eventId !== event.id) {
                throw new Error("CHANGE_REQUEST_EVENT_MISMATCH");
            }

            if (changeRequest.status !== "PENDING") {
                throw new Error("CHANGE_REQUEST_ALREADY_REVIEWED");
            }

            // 4. Reject the pending request.
            const updatedRequest =
                await tx.eventChangeRequest.update({
                    where: { id: requestId },
                    data: {
                        status: "REJECTED",
                        reviewedById: adminId,
                        reviewedAt: new Date(),
                        reviewComment: reviewComment ?? null
                    }
                });

            return updatedRequest;
        });

        return res.status(200).json({
            message: "Event change request rejected successfully",
            changeRequest: result
        });

    } catch (error) {
        if (error instanceof Error) {
            switch (error.message) {
                case "CHANGE_REQUEST_NOT_FOUND":
                case "EVENT_NOT_FOUND":
                    return res.status(404).json({
                        message: "Event or change request not found"
                    });

                case "CHANGE_REQUEST_ALREADY_REVIEWED":
                    return res.status(400).json({
                        message: "This change request has already been reviewed"
                    });

                case "CHANGE_REQUEST_EVENT_MISMATCH":
                    return res.status(400).json({
                        message: "Change request does not belong to the event"
                    });
            }
        }

        console.error("Reject event change request error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}

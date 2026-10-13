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

        const changeRequest = await prisma.eventChangeRequest.findUnique({
            where: { id: requestId },
            include: {
                event: {
                    include: {
                        booking: true
                    }
                },
                requestedVenue: true
            }
        });

        if (!changeRequest) {
            return res.status(404).json({
                message: "Change request not found"
            });
        }

        if (changeRequest.status !== "PENDING") {
            return res.status(400).json({
                message: "This change request has already been reviewed"
            });
        }

        if (changeRequest.event.status !== "APPROVED") {
            return res.status(400).json({
                message: "Only approved events can have their changes applied"
            });
        }

        if (!changeRequest.event.booking) {
            return res.status(400).json({
                message: "Event booking not found"
            });
        }

        const result = await prisma.$transaction(async (tx) => {

            // 1. Lock the requested venue.
            const lockedVenues = await tx.$queryRaw<
                { id: string; capacity: number }[]
            >`
                SELECT id, capacity
                FROM Venue
                WHERE id = ${changeRequest.requestedVenueId}
                FOR UPDATE
            `;

            if (lockedVenues.length === 0) {
                throw new Error("REQUESTED_VENUE_NOT_FOUND");
            }

            const requestedVenue = lockedVenues[0];

            // 2. Check capacity using the locked venue's current capacity.
            if (
                changeRequest.event.maxParticipants !== null &&
                changeRequest.event.maxParticipants > requestedVenue.capacity
            ) {
                throw new Error("VENUE_CAPACITY_EXCEEDED");
            }

            // 3. Check availability while holding the venue lock.
            const conflictingBooking = await tx.booking.findFirst({
                where: {
                    venueId: changeRequest.requestedVenueId,
                    eventId: {
                        not: changeRequest.eventId
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

            // 4. Update the event's date and time.
            const updatedEvent = await tx.event.update({
                where: {
                    id: changeRequest.eventId
                },
                data: {
                    startTime: changeRequest.requestedStartTime,
                    endTime: changeRequest.requestedEndTime
                }
            });

            // 5. Update its venue booking.
            await tx.booking.update({
                where: {
                    eventId: changeRequest.eventId
                },
                data: {
                    venueId: changeRequest.requestedVenueId,
                    startTime: changeRequest.requestedStartTime,
                    endTime: changeRequest.requestedEndTime
                }
            });

            // 6. Mark the change request as approved.
            const updatedRequest = await tx.eventChangeRequest.update({
                where: {
                    id: requestId
                },
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

            if (error.message === "VENUE_TIME_CONFLICT") {
                return res.status(409).json({
                    message: "The requested venue is already booked during this time"
                });
            }

            if (error.message === "VENUE_CAPACITY_EXCEEDED") {
                return res.status(400).json({
                    message: "Event participant limit exceeds the requested venue capacity"
                });
            }

            if (error.message === "REQUESTED_VENUE_NOT_FOUND") {
                return res.status(404).json({
                    message: "Requested venue not found"
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

        if (typeof requestId !== "string") {
            return res.status(400).json({
                message: "Invalid change request ID"
            });
        }

        const adminId = req.user.id;
        const { reviewComment } = req.body ?? {};

        const changeRequest =
            await prisma.eventChangeRequest.findUnique({
                where: { id: requestId }
            });

        if (!changeRequest) {
            return res.status(404).json({
                message: "Change request not found"
            });
        }

        if (changeRequest.status !== "PENDING") {
            return res.status(400).json({
                message: "This change request has already been reviewed"
            });
        }

        const updatedRequest =
            await prisma.eventChangeRequest.update({
                where: { id: requestId },
                data: {
                    status: "REJECTED",
                    reviewedById: adminId,
                    reviewedAt: new Date(),
                    reviewComment: reviewComment ?? null
                }
            });

        return res.status(200).json({
            message: "Event change request rejected successfully",
            changeRequest: updatedRequest
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}
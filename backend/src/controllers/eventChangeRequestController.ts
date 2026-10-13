import { Request, Response } from "express";
import prisma from "../utils/prisma";

export async function createEventChangeRequest(
    req: Request,
    res: Response
) {
    try {
        const eventId = String(req.params.eventId);
        const userId = req.user.id;

        const {
            startTime,
            endTime,
            venueId,
            reason
        } = req.body;

        // 1. Validate required fields
        if (!startTime || !endTime || !venueId) {
            return res.status(400).json({
                message: "Start time, end time, and venue ID are required"
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

        // 3. Find the event
        const event = await prisma.event.findUnique({
            where: {
                id: eventId
            },
            include: {
                booking: true
            }
        });

        if (!event) {
            return res.status(404).json({
                message: "Event not found"
            });
        }

        // 4. Check organizer ownership
        if (event.organizerId !== userId) {
            return res.status(403).json({
                message: "Only the event organizer can request changes"
            });
        }

        // 5. Only approved events can use this workflow
        if (event.status !== "APPROVED") {
            return res.status(400).json({
                message: "Only approved events can request date or venue changes"
            });
        }

        if (!event.booking) {
            return res.status(400).json({
                message: "Event does not have a venue booking"
            });
        }

        // 6. Check that the requested venue exists
        const venue = await prisma.venue.findUnique({
            where: {
                id: venueId
            }
        });

        if (!venue) {
            return res.status(404).json({
                message: "Requested venue not found"
            });
        }

        // 7. Check participant capacity against the new venue
        if (
            event.maxParticipants !== null &&
            event.maxParticipants > venue.capacity
        ) {
            return res.status(400).json({
                message: "Event participant limit exceeds the requested venue capacity"
            });
        }

        // 8. Prevent multiple pending requests for the same event
        const pendingRequest =
            await prisma.eventChangeRequest.findFirst({
                where: {
                    eventId,
                    status: "PENDING"
                }
            });

        if (pendingRequest) {
            return res.status(409).json({
                message: "This event already has a pending change request"
            });
        }

        // 9. Create the request without changing the event or booking
        const changeRequest =
            await prisma.eventChangeRequest.create({
                data: {
                    eventId,
                    requestedById: userId,
                    requestedStartTime: start,
                    requestedEndTime: end,
                    requestedVenueId: venueId,
                    reason: reason ?? null
                }
            });

        return res.status(201).json({
            message: "Event change request submitted successfully",
            changeRequest
        });

    } catch (error) {
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
        const eventId = String(req.params.eventId);
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
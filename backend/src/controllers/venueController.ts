import { Request, Response } from "express";
import prisma from "../utils/prisma";

// Create a venue
export async function createVenue(req: Request, res: Response) {
    try {
        const { name, location, capacity } = req.body;

        if (
            typeof name !== "string" ||
            name.trim() === "" ||
            typeof location !== "string" ||
            location.trim() === "" ||
            capacity === undefined
        ) {
            return res.status(400).json({
                message: "Name, location, and capacity are required"
            });
        }

        if (
            typeof capacity !== "number" ||
            !Number.isInteger(capacity) ||
            capacity <= 0
        ) {
            return res.status(400).json({
                message: "Capacity must be a positive integer"
            });
        }

        const venue = await prisma.venue.create({
            data: {
                name: name.trim(),
                location: location.trim(),
                capacity
            }
        });

        return res.status(201).json({
            message: "Venue created successfully",
            venue
        });

    } catch (error) {
        console.error("Create venue error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}


// Get all venues
export async function getVenues(req: Request, res: Response) {
    try {
        const venues = await prisma.venue.findMany({
            orderBy: {
                createdAt: "desc"
            }
        });

        return res.status(200).json({
            message: "Venues fetched successfully",
            venues
        });

    } catch (error) {
        console.error("Get venues error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}


// Get a single venue
export async function getVenue(req: Request, res: Response) {
    try {
        const venueId = String(req.params.venueId);

        const venue = await prisma.venue.findUnique({
            where: {
                id: venueId
            }
        });

        if (!venue) {
            return res.status(404).json({
                message: "Venue not found"
            });
        }

        return res.status(200).json({
            message: "Venue fetched successfully",
            venue
        });

    } catch (error) {
        console.error("Get venue error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}


// Update a venue
// Update a venue
export async function updateVenue(req: Request, res: Response) {
    try {
        const venueId = String(req.params.venueId);
        const { name, location, capacity } = req.body;

        if (
            name === undefined &&
            location === undefined &&
            capacity === undefined
        ) {
            return res.status(400).json({
                message: "At least one field must be provided"
            });
        }

        if (
            name !== undefined &&
            (typeof name !== "string" || name.trim() === "")
        ) {
            return res.status(400).json({
                message: "Name must be a non-empty string"
            });
        }

        if (
            location !== undefined &&
            (typeof location !== "string" || location.trim() === "")
        ) {
            return res.status(400).json({
                message: "Location must be a non-empty string"
            });
        }

        if (
            capacity !== undefined &&
            (
                typeof capacity !== "number" ||
                !Number.isInteger(capacity) ||
                capacity <= 0
            )
        ) {
            return res.status(400).json({
                message: "Capacity must be a positive integer"
            });
        }

        const updatedVenue = await prisma.$transaction(async (tx) => {

            // 1. Lock the venue row.
            const lockedVenues = await tx.$queryRaw<
                { id: string; capacity: number }[]
            >`
                SELECT id, capacity
                FROM Venue
                WHERE id = ${venueId}
                FOR UPDATE
            `;

            if (lockedVenues.length === 0) {
                throw new Error("VENUE_NOT_FOUND");
            }

            // 2. Check existing bookings while holding the lock.
            if (capacity !== undefined) {
                const bookings = await tx.booking.findMany({
                    where: { venueId },
                    include: {
                        event: {
                            select: {
                                maxParticipants: true
                            }
                        }
                    }
                });

                const exceedsEventLimit = bookings.some(
                    booking =>
                        booking.event.maxParticipants !== null &&
                        booking.event.maxParticipants > capacity
                );

                if (exceedsEventLimit) {
                    throw new Error("VENUE_CAPACITY_EXCEEDED");
                }
            }

            // 3. Update the venue within the same transaction.
            return tx.venue.update({
                where: { id: venueId },
                data: {
                    ...(name !== undefined && {
                        name: name.trim()
                    }),
                    ...(location !== undefined && {
                        location: location.trim()
                    }),
                    ...(capacity !== undefined && {
                        capacity
                    })
                }
            });
        });

        return res.status(200).json({
            message: "Venue updated successfully",
            venue: updatedVenue
        });

    } catch (error) {
        if (error instanceof Error) {
            if (error.message === "VENUE_NOT_FOUND") {
                return res.status(404).json({
                    message: "Venue not found"
                });
            }

            if (error.message === "VENUE_CAPACITY_EXCEEDED") {
                return res.status(400).json({
                    message: "Capacity cannot be less than an assigned event's participant limit"
                });
            }
        }

        console.error("Update venue error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}


// Delete a venue
// Delete a venue
export async function deleteVenue(req: Request, res: Response) {
    try {
        const venueId = String(req.params.venueId);

        await prisma.$transaction(async (tx) => {

            // 1. Lock the venue row.
            const lockedVenues = await tx.$queryRaw<
                { id: string }[]
            >`
                SELECT id
                FROM Venue
                WHERE id = ${venueId}
                FOR UPDATE
            `;

            if (lockedVenues.length === 0) {
                throw new Error("VENUE_NOT_FOUND");
            }

            // 2. Check for existing bookings.
            const bookingCount = await tx.booking.count({
                where: { venueId }
            });

            if (bookingCount > 0) {
                throw new Error("VENUE_HAS_BOOKINGS");
            }

            // 3. Check for pending change requests.
            const pendingRequestCount =
                await tx.eventChangeRequest.count({
                    where: {
                        requestedVenueId: venueId,
                        status: "PENDING"
                    }
                });

            if (pendingRequestCount > 0) {
                throw new Error("VENUE_HAS_PENDING_REQUESTS");
            }

            // 4. Delete the venue while holding the lock.
            await tx.venue.delete({
                where: { id: venueId }
            });
        });

        return res.status(200).json({
            message: "Venue deleted successfully"
        });

    } catch (error) {

        if (error instanceof Error) {

            if (error.message === "VENUE_NOT_FOUND") {
                return res.status(404).json({
                    message: "Venue not found"
                });
            }

            if (error.message === "VENUE_HAS_BOOKINGS") {
                return res.status(409).json({
                    message: "Cannot delete a venue that has active bookings"
                });
            }

            if (error.message === "VENUE_HAS_PENDING_REQUESTS") {
                return res.status(409).json({
                    message: "Cannot delete a venue referenced by pending change requests"
                });
            }
        }

        console.error("Delete venue error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}
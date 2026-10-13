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

        const venue = await prisma.venue.findUnique({
            where: { id: venueId },
            include: {
                bookings: {
                    include: {
                        event: true
                    }
                }
            }
        });

        if (!venue) {
            return res.status(404).json({
                message: "Venue not found"
            });
        }

        if (capacity !== undefined) {
            const exceedsEventLimit = venue.bookings.some(
                booking =>
                    booking.event.maxParticipants !== null &&
                    booking.event.maxParticipants > capacity
            );

            if (exceedsEventLimit) {
                return res.status(400).json({
                    message: "Capacity cannot be less than an assigned event's participant limit"
                });
            }
        }

        const updatedVenue = await prisma.venue.update({
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

        return res.status(200).json({
            message: "Venue updated successfully",
            venue: updatedVenue
        });

    } catch (error) {
        console.error("Update venue error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}


// Delete a venue
export async function deleteVenue(req: Request, res: Response) {
    try {
        const venueId = String(req.params.venueId);

        const venue = await prisma.venue.findUnique({
            where: { id: venueId }
        });

        if (!venue) {
            return res.status(404).json({
                message: "Venue not found"
            });
        }

        const [bookingCount, pendingRequestCount] =
            await prisma.$transaction([
                prisma.booking.count({
                    where: { venueId }
                }),
                prisma.eventChangeRequest.count({
                    where: {
                        requestedVenueId: venueId,
                        status: "PENDING"
                    }
                })
            ]);

        if (bookingCount > 0) {
            return res.status(409).json({
                message: "Cannot delete a venue that has active bookings"
            });
        }

        if (pendingRequestCount > 0) {
            return res.status(409).json({
                message: "Cannot delete a venue referenced by pending change requests"
            });
        }

        await prisma.venue.delete({
            where: { id: venueId }
        });

        return res.status(200).json({
            message: "Venue deleted successfully"
        });

    } catch (error) {
        console.error("Delete venue error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}
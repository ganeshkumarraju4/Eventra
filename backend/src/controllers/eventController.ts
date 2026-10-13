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

        if (
            maxParticipants !== undefined &&
            maxParticipants !== null &&
            maxParticipants <= 0
        ) {
            return res.status(400).json({
                message: "Maximum participants must be greater than 0"
            });
        }
         if (
            maxParticipants !== undefined &&
            maxParticipants !== null &&
            maxParticipants > venue.capacity
        ) {
            return res.status(400).json({
                message: "Maximum participants cannot exceed venue capacity"
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

        const conflictingBooking = await prisma.booking.findFirst({
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
            return res.status(409).json({
                message: "The venue is already booked for the selected time slot"
            });
        }
        const result = await prisma.$transaction(async (tx) => {

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
        console.error(error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}
export async function approveEvent(req: Request, res: Response) {
    try {
        const eventId = String(req.params.eventId);

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

        if (event.status !== "PENDING") {
            return res.status(400).json({
                message: "Only pending events can be approved"
            });
        }

        const updatedEvent = await prisma.event.update({
            where: {
                id: eventId
            },
            data: {
                status: "APPROVED"
            }
        });

        return res.status(200).json({
            message: "Event approved successfully",
            event: updatedEvent
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}
export async function rejectEvent(req: Request, res: Response) {
    try {
        const eventId = String(req.params.eventId);

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

        if (event.status !== "PENDING") {
            return res.status(400).json({
                message: "Only pending events can be rejected"
            });
        }

        const updatedEvent = await prisma.event.update({
            where: {
                id: eventId
            },
            data: {
                status: "REJECTED"
            }
        });

        return res.status(200).json({
            message: "Event rejected successfully",
            event: updatedEvent
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}

export async function getApprovedEvents(req: Request, res: Response) {
    try {
        const events = await prisma.event.findMany({
            where: {
                status: "APPROVED"
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
    try{
        const eventId = String(req.params.eventId);

        if(!eventId){
            return res.status(400).json({
                message: "Event ID is required"
            });
        }
        const event  = await prisma.event.findUnique({
            where: {
                id: eventId
            }
        });
        if(!event){
            return res.status(404).json({
                message: "Event not found"
            });
        }
        return res.status(200).json({
            message: "Event fetched successfully",
            event
        });
    }
    catch(error){
        return res.status(500).json({
            message: "Internal server error"
        });
    }
}
export async function updateEvent(req: Request, res: Response) {
try {
const eventId = String(req.params.eventId);
const userId = req.user!.id;


    const { title, description, category } = req.body;

    // Validate that at least one editable field was supplied.
    if (
        title === undefined &&
        description === undefined &&
        category === undefined
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

    // Update only explicitly supplied fields.
    const updatedEvent = await prisma.event.update({
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
            })
        }
    });

    return res.status(200).json({
        message: "Event updated successfully",
        event: updatedEvent
    });

} catch (error) {
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
                message: "Only the event organizer can cancel this event"
            });
        }

        if (event.status === "CANCELLED") {
            return res.status(400).json({
                message: "Event is already cancelled"
            });
        }

        if (event.status === "REJECTED") {
            return res.status(400).json({
                message: "Rejected events cannot be cancelled"
            });
        }

        const result = await prisma.$transaction(async (tx) => {
            const updatedEvent = await tx.event.update({
                where: { id: eventId },
                data: {
                    status: "CANCELLED"
                }
            });

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

            const booking = await tx.booking.deleteMany({
                where: {
                    eventId
                }
            });

            return {
                event: updatedEvent,
                cancelledRegistrations: registrations.count,
                releasedBookings: booking.count
            };
        });

        return res.status(200).json({
            message: "Event cancelled successfully",
            ...result
        });

    } catch (error) {
        console.error("Cancel event error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}

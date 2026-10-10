import prisma from "./prisma";

export async function getOrganizerEvent(
    eventId: string,
    userId: string
) {
    const event = await prisma.event.findUnique({
        where: {
            id: eventId
        }
    });

    if (!event) {
        return {
            error: "EVENT_NOT_FOUND",
            event: null
        };
    }

    if (event.organizerId !== userId) {
        return {
            error: "NOT_ORGANIZER",
            event: null
        };
    }

    return {
        error: null,
        event
    };
}
import { Request, Response } from "express";
import prisma from "../utils/prisma";

export async function submitEventFeedback(req: Request, res: Response) {
    try {
        const eventId = String(req.params.eventId);
        const userId = req.user.id;
        const { rating, comment } = req.body as {
            rating?: unknown;
            comment?: unknown;
        };

        if (
            typeof rating !== "number" ||
            !Number.isInteger(rating) ||
            rating < 1 ||
            rating > 5
        ) {
            return res.status(400).json({
                message: "Rating must be a whole number from 1 to 5"
            });
        }

        if (
            comment !== undefined &&
            comment !== null &&
            (typeof comment !== "string" || comment.trim().length > 1000)
        ) {
            return res.status(400).json({
                message: "Comment must be 1000 characters or fewer"
            });
        }

        const event = await prisma.event.findUnique({
            where: { id: eventId },
            select: {
                id: true,
                endTime: true,
                status: true,
                type: true
            }
        });

        if (!event || event.status !== "APPROVED" || event.type !== "PUBLIC") {
            return res.status(404).json({ message: "Event not found" });
        }

        if (event.endTime > new Date()) {
            return res.status(400).json({
                message: "Feedback is available after the event has ended"
            });
        }

        const registration = await prisma.registration.findUnique({
            where: {
                userId_eventId: { userId, eventId }
            },
            select: { status: true }
        });

        if (!registration || registration.status !== "APPROVED") {
            return res.status(403).json({
                message: "Only attendees with an approved registration can leave feedback"
            });
        }

        const feedback = await prisma.eventFeedback.upsert({
            where: {
                eventId_userId: { eventId, userId }
            },
            update: {
                rating,
                comment: typeof comment === "string" ? comment.trim() || null : null
            },
            create: {
                eventId,
                userId,
                rating,
                comment: typeof comment === "string" ? comment.trim() || null : null
            }
        });

        return res.status(200).json({
            message: "Feedback saved successfully",
            feedback
        });
    } catch (error) {
        console.error("Submit event feedback error:", error);
        return res.status(500).json({ message: "Unable to save feedback" });
    }
}

export async function getRecentlyCompletedEvents(_req: Request, res: Response) {
    try {
        const now = new Date();
        const recentCutoff = new Date(now);
        recentCutoff.setDate(recentCutoff.getDate() - 90);

        const events = await prisma.event.findMany({
            where: {
                status: "APPROVED",
                type: "PUBLIC",
                endTime: { gte: recentCutoff, lte: now },
                feedbacks: { some: {} }
            },
            include: {
                booking: {
                    include: { venue: true }
                },
                feedbacks: {
                    select: { rating: true }
                }
            }
        });

        const rankedEvents = events
            .map(({ booking, feedbacks, ...event }) => ({
                ...event,
                venue: booking?.venue ?? null,
                averageRating:
                    feedbacks.reduce((sum, feedback) => sum + feedback.rating, 0) /
                    feedbacks.length,
                feedbackCount: feedbacks.length
            }))
            .sort(
                (a, b) =>
                    b.averageRating - a.averageRating ||
                    b.feedbackCount - a.feedbackCount ||
                    b.endTime.getTime() - a.endTime.getTime()
            )
            .slice(0, 6);

        return res.status(200).json({
            message: "Recently completed events fetched successfully",
            events: rankedEvents
        });
    } catch (error) {
        console.error("Get recently completed events error:", error);
        return res.status(500).json({
            message: "Unable to fetch recently completed events"
        });
    }
}

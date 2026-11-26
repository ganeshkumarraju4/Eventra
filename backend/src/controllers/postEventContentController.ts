import { Request, Response } from "express";
import { v2 as cloudinary } from "cloudinary";
import type { UploadApiResponse } from "cloudinary";
import prisma from "../utils/prisma";

const MAX_PHOTOS_PER_EVENT = 8;

function uploadPhoto(
    file: Express.Multer.File,
    folder: string
): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: "image",
                allowed_formats: ["jpg", "jpeg", "png", "webp"]
            },
            (error, result) => {
                if (error) {
                    reject(error);
                } else if (!result) {
                    reject(new Error("Cloudinary returned no upload result"));
                } else {
                    resolve(result);
                }
            }
        );

        stream.end(file.buffer);
    });
}

export async function savePostEventContent(req: Request, res: Response) {
    const uploadedPhotos: UploadApiResponse[] = [];

    try {
        const eventId = String(req.params.eventId);
        const userId = req.user.id;
        const description = req.body.postEventDescription;
        const photos = Array.isArray(req.files)
            ? req.files as Express.Multer.File[]
            : [];

        if (
            description !== undefined &&
            (typeof description !== "string" || description.length > 5000)
        ) {
            return res.status(400).json({
                message: "Post-event description must be 5000 characters or fewer"
            });
        }

        if (description === undefined && photos.length === 0) {
            return res.status(400).json({
                message: "Add a description or at least one photo"
            });
        }

        const event = await prisma.event.findUnique({
            where: { id: eventId },
            select: {
                id: true,
                organizerId: true,
                status: true,
                endTime: true,
                _count: { select: { postEventPhotos: true } }
            }
        });

        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }
        if (event.organizerId !== userId) {
            return res.status(403).json({
                message: "Only the event organizer can add post-event content"
            });
        }
        if (event.status !== "APPROVED" || event.endTime > new Date()) {
            return res.status(400).json({
                message: "Post-event content can be added after an approved event has ended"
            });
        }
        if (event._count.postEventPhotos + photos.length > MAX_PHOTOS_PER_EVENT) {
            return res.status(400).json({
                message: `An event can have up to ${MAX_PHOTOS_PER_EVENT} photos`
            });
        }

        if (photos.length > 0) {
            const cloudinaryConfig = {
                cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
                api_key: process.env.CLOUDINARY_API_KEY,
                api_secret: process.env.CLOUDINARY_API_SECRET
            };

            if (
                !cloudinaryConfig.cloud_name ||
                !cloudinaryConfig.api_key ||
                !cloudinaryConfig.api_secret
            ) {
                return res.status(503).json({
                    message: "Photo uploads are not configured. Set the Cloudinary environment variables."
                });
            }

            cloudinary.config(cloudinaryConfig);
            for (const photo of photos) {
                uploadedPhotos.push(
                    await uploadPhoto(photo, `event-manager/events/${eventId}`)
                );
            }
        }

        const updatedEvent = await prisma.$transaction(async (tx) => {
            await tx.event.update({
                where: { id: eventId },
                data: {
                    ...(description !== undefined && {
                        postEventDescription: description.trim() || null
                    })
                }
            });

            if (uploadedPhotos.length > 0) {
                await tx.eventPostPhoto.createMany({
                    data: uploadedPhotos.map((photo) => ({
                        eventId,
                        url: photo.secure_url,
                        publicId: photo.public_id
                    }))
                });
            }

            return tx.event.findUniqueOrThrow({
                where: { id: eventId },
                include: {
                    postEventPhotos: { orderBy: { createdAt: "asc" } }
                }
            });
        });

        return res.status(200).json({
            message: "Post-event content saved successfully",
            event: updatedEvent
        });
    } catch (error) {
        if (uploadedPhotos.length > 0) {
            await Promise.allSettled(
                uploadedPhotos.map((photo) =>
                    cloudinary.uploader.destroy(photo.public_id, {
                        resource_type: "image"
                    })
                )
            );
        }

        console.error("Save post-event content error:", error);
        return res.status(500).json({
            message: "Unable to save post-event content"
        });
    }
}

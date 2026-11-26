import { Request, Response } from "express";
import { v2 as cloudinary } from "cloudinary";
import type { UploadApiResponse } from "cloudinary";
import prisma from "../utils/prisma";

function configureCloudinary() {
    const config = {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    };

    if (!config.cloud_name || !config.api_key || !config.api_secret) {
        return false;
    }

    cloudinary.config(config);
    return true;
}

function uploadCover(file: Express.Multer.File, eventId: string): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: `event-manager/events/${eventId}`,
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

export async function uploadEventCover(req: Request, res: Response) {
    let uploadedImage: UploadApiResponse | undefined;
    let uploadAttempted = false;

    try {
        const eventId = String(req.params.eventId);
        const file = req.file;

        if (!file) {
            return res.status(400).json({ message: "Choose an image to upload" });
        }

        const event = await prisma.event.findUnique({
            where: { id: eventId },
            select: {
                id: true,
                organizerId: true,
                status: true,
                coverImagePublicId: true
            }
        });

        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }
        if (event.organizerId !== req.user.id) {
            return res.status(403).json({
                message: "Only the event organizer can change its cover image"
            });
        }
        if (event.status === "CANCELLED" || event.status === "REJECTED") {
            return res.status(400).json({
                message: "Cancelled or rejected events cannot have their cover image changed"
            });
        }
        if (!configureCloudinary()) {
            return res.status(503).json({
                message: "Photo uploads are not configured. Set the Cloudinary environment variables."
            });
        }

        uploadAttempted = true;
        uploadedImage = await uploadCover(file, eventId);
        const updatedEvent = await prisma.event.update({
            where: { id: eventId },
            data: {
                coverImageUrl: uploadedImage.secure_url,
                coverImagePublicId: uploadedImage.public_id
            },
            select: {
                id: true,
                coverImageUrl: true
            }
        });

        if (event.coverImagePublicId) {
            try {
                const deleteResult = await cloudinary.uploader.destroy(
                    event.coverImagePublicId,
                    { resource_type: "image" }
                );
                if (deleteResult.result !== "ok" && deleteResult.result !== "not found") {
                    console.error("Could not remove previous event cover from Cloudinary:", deleteResult);
                }
            } catch (deleteError) {
                console.error("Could not remove previous event cover from Cloudinary:", deleteError);
            }
        }

        return res.status(200).json({
            message: "Event cover image updated successfully",
            event: updatedEvent
        });
    } catch (error) {
        if (uploadedImage) {
            await cloudinary.uploader.destroy(uploadedImage.public_id, {
                resource_type: "image"
            }).catch((cleanupError: unknown) => {
                console.error("Could not clean up failed event cover upload:", cleanupError);
            });
        }

        if (uploadAttempted && !uploadedImage) {
            const cloudinaryError = error as {
                http_code?: unknown;
                message?: unknown;
            };
            const statusCode =
                typeof cloudinaryError.http_code === "number"
                    ? cloudinaryError.http_code
                    : undefined;

            console.error("Cloudinary event cover upload failed:", {
                statusCode,
                message:
                    typeof cloudinaryError.message === "string"
                        ? cloudinaryError.message
                        : "Unknown Cloudinary error"
            });

            return res.status(502).json({
                message:
                    statusCode === 401 || statusCode === 403
                        ? "Cloudinary rejected the credentials. Verify the Cloud Name, API Key, and API Secret in backend/.env, then restart the backend."
                        : statusCode === 400
                          ? "Cloudinary rejected this image. Try a valid JPEG, PNG, or WebP image under 5 MB."
                          : "Cloudinary could not upload this image. Verify the Cloudinary credentials and check the backend terminal for details."
            });
        }

        console.error("Save event cover to database error:", error);
        return res.status(500).json({ message: "Unable to update event cover image" });
    }
}

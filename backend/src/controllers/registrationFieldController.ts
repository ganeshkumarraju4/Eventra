import { Request, Response } from "express";
import prisma from "../utils/prisma";
import { FieldType } from "../generated/prisma/enums";
import { getOrganizerEvent } from "../utils/eventAuthorization";
export async function createRegistrationField(
    req: Request,
    res: Response
) {
    try {
        const eventId = String(req.params.eventId);
        const userId = req.user.id;

        const {
            label,
            fieldType,
            required,
            placeholder,
            options
        } = req.body;

        if (!eventId) {
            return res.status(400).json({
                message: "Event ID is required"
            });
        }

        if (!label || !fieldType) {
            return res.status(400).json({
                message: "Label and field type are required"
            });
        }

        // Check whether the field type is valid
        if (!Object.values(FieldType).includes(fieldType)) {
            return res.status(400).json({
                message: "Invalid field type"
            });
        }

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

        if (event.status === "REJECTED") {
            return res.status(400).json({
                message: "Cannot modify registration form of a rejected event"
            });
        }

        // Only the event organizer can create registration fields
        if (event.organizerId !== userId) {
            return res.status(403).json({
                message: "You are not the organizer of this event"
            });
        }

        // SELECT and CHECKBOX fields need options
      if (
            (fieldType === "SELECT" ||
                fieldType === "CHECKBOX") &&
            (!options || !Array.isArray(options) || options.length === 0)
        ) {
            return res.status(400).json({
                message: "Options are required for SELECT and CHECKBOX fields"
            });
        }


        // Other field types should not need options
        if (
            fieldType !== "SELECT" &&
            fieldType !== "CHECKBOX" &&
            options !== undefined
        ) {
            return res.status(400).json({
                message: "Options are only allowed for SELECT and CHECKBOX fields"
            });
        }

        const lastField = await prisma.registrationField.findFirst({
            where: {
                eventId
            },
            orderBy: {
                order: "desc"
            }
        });

        const order = lastField ? lastField.order + 1 : 1;

        const field = await prisma.registrationField.create({
            data: {
                eventId,
                label,
                fieldType,
                required: required ?? false,
                placeholder,
                options,
                order
            }
        });

        return res.status(201).json({
            message: "Registration field created successfully",
            field
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}
export async function getRegistrationFields(
    req: Request,
    res: Response
) {
    try {
        const eventId = String(req.params.eventId);

        if (!eventId) {
            return res.status(400).json({
                message: "Event ID is required"
            });
        }

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

        const fields = await prisma.registrationField.findMany({
            where: {
                eventId
            },
            orderBy: {
                order: "asc"
            }
        });

        return res.status(200).json({
            message: "Registration fields fetched successfully",
            fields
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}
export async function updateRegistrationField(
    req: Request,
    res: Response
) {
    try {
        const eventId = String(req.params.eventId);
        const fieldId = String(req.params.fieldId);
        const userId = req.user.id;

        const {
            label,
            required,
            placeholder,
            options,
            order
        } = req.body;

        const { event, error } = await getOrganizerEvent(
            eventId,
            userId
        );

        if (error === "EVENT_NOT_FOUND") {
            return res.status(404).json({
                message: "Event not found"
            });
        }

        if (error === "NOT_ORGANIZER") {
            return res.status(403).json({
                message: "You are not the organizer of this event"
            });
        }

        if (event!.status === "REJECTED") {
            return res.status(400).json({
                message: "Cannot modify registration form of a rejected event"
            });
        }

        const field = await prisma.registrationField.findUnique({
            where: {
                id: fieldId
            }
        });

        if (!field) {
            return res.status(404).json({
                message: "Registration field not found"
            });
        }

        if (field.eventId !== eventId) {
            return res.status(400).json({
                message: "Registration field does not belong to this event"
            });
        }

        const answerCount = await prisma.registrationAnswer.count({
            where: {
                fieldId
            }
        });

        if (options !== undefined && answerCount > 0) {
            return res.status(400).json({
                message: "Cannot change options after users have answered this field"
            });
        }

        if (
            options !== undefined &&
            options !== null &&
            !Array.isArray(options)
        ) {
            return res.status(400).json({
                message: "Options must be an array"
            });
        }

        if (
            field.fieldType !== "SELECT" &&
            field.fieldType !== "CHECKBOX" &&
            options !== undefined
        ) {
            return res.status(400).json({
                message: "Options are only allowed for SELECT and CHECKBOX fields"
            });
        }

        const updatedField = await prisma.registrationField.update({
            where: {
                id: fieldId
            },
            data: {
                ...(label !== undefined && { label }),
                ...(required !== undefined && { required }),
                ...(placeholder !== undefined && { placeholder }),
                ...(options !== undefined && { options }),
                ...(order !== undefined && { order })
            }
        });

        return res.status(200).json({
            message: "Registration field updated successfully",
            field: updatedField
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}
export async function deleteRegistrationField(
  req: Request,
  res: Response
) {
  try {
    const eventId = String(req.params.eventId);
    const fieldId = String(req.params.fieldId);
    const userId = req.user.id;

    const { event, error } = await getOrganizerEvent(
      eventId,
      userId
    );

    if (error === "EVENT_NOT_FOUND") {
      return res.status(404).json({
        message: "Event not found"
      });
    }

    if (error === "NOT_ORGANIZER") {
      return res.status(403).json({
        message: "You are not the organizer of this event"
      });
    }

    if (event!.status === "REJECTED") {
      return res.status(400).json({
        message: "Cannot modify registration form of a rejected event"
      });
    }

    const field = await prisma.registrationField.findUnique({
      where: { id: fieldId }
    });

    if (!field) {
      return res.status(404).json({
        message: "Registration field not found"
      });
    }

    if (field.eventId !== eventId) {
      return res.status(400).json({
        message: "Registration field does not belong to this event"
      });
    }

    const answerCount = await prisma.registrationAnswer.count({
      where: { fieldId }
    });

    if (answerCount > 0) {
      return res.status(400).json({
        message: "Cannot delete a field that has existing answers"
      });
    }

    await prisma.registrationField.delete({
      where: { id: fieldId }
    });

    return res.status(200).json({
      message: "Registration field deleted successfully"
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
}
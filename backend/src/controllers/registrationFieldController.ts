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

        const field = await prisma.$transaction(async (tx) => {
    // Lock the event row to serialize field creation for this event.
    const lockedEvents = await tx.$queryRaw<{ id: string }[]>`
        SELECT id
        FROM \`event\`
        WHERE id = ${eventId}
        FOR UPDATE
    `;

    if (lockedEvents.length === 0) {
        throw new Error("EVENT_NOT_FOUND");
    }

    // Recalculate the order while holding the lock.
    const lastField = await tx.registrationField.findFirst({
        where: {
            eventId
        },
        orderBy: {
            order: "desc"
        }
    });

    const order = lastField ? lastField.order + 1 : 1;

    // Create the field within the same transaction.
    return tx.registrationField.create({
        data: {
            eventId,
            label: label.trim(),
            fieldType,
            required: required ?? false,
            placeholder,
            options,
            order
        }
    });
    
});
return res.status(201).json({
    message: "Registration field created successfully",
    field
});
} catch (error) {
    if (
        error instanceof Error &&
        error.message === "EVENT_NOT_FOUND"
    ) {
        return res.status(404).json({
            message: "Event not found"
        });
    }

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
        const userId = req.user.id;

        if (!eventId || eventId === "undefined") {
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
        const userRole = req.user.role;


        // Private-event registration fields are visible only to the organizer.
        if (
            event.type === "PRIVATE" &&
            event.organizerId !== userId &&
            userRole !== "ADMIN"
        ) {
            return res.status(403).json({
                message: "You are not allowed to view these registration fields"
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
        // Validate label
if (
    label !== undefined &&
    (typeof label !== "string" || label.trim().length === 0)
) {
    return res.status(400).json({
        message: "Label must be a non-empty string"
    });
}

// Validate required
if (
    required !== undefined &&
    typeof required !== "boolean"
) {
    return res.status(400).json({
        message: "Required must be a boolean"
    });
}

// Validate placeholder
if (
    placeholder !== undefined &&
    placeholder !== null &&
    typeof placeholder !== "string"
) {
    return res.status(400).json({
        message: "Placeholder must be a string or null"
    });
}

// Validate order
if (
    order !== undefined &&
    (!Number.isInteger(order) || order < 0)
) {
    return res.status(400).json({
        message: "Order must be a non-negative integer"
    });
}

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

        const updatedField = await prisma.$transaction(async (tx) => {
  
    // 1. Lock the event row first
const lockedEvents = await tx.$queryRaw<
    { id: string; organizerId: string; status: string }[]
>`
    SELECT id, organizerId, status
    FROM \`event\`
    WHERE id = ${eventId}
    FOR UPDATE
`;

const lockedEvent = lockedEvents[0];

// Verify event still exists
if (!lockedEvent) {
    throw new Error("EVENT_NOT_FOUND");
}

// Recheck organizer ownership inside the transaction
if (lockedEvent.organizerId !== userId) {
    throw new Error("NOT_ORGANIZER");
}

// Prevent modification of rejected or cancelled events
if (
    lockedEvent.status === "REJECTED" ||
    lockedEvent.status === "CANCELLED"
) {
    throw new Error("EVENT_NOT_MODIFIABLE");
}

    // 2. Lock the registration-field row
    const lockedFields = await tx.$queryRaw<{ id: string }[]>`
        SELECT id
        FROM \`RegistrationField\`
        WHERE id = ${fieldId}
          AND eventId = ${eventId}
        FOR UPDATE
    `;

    if (lockedFields.length === 0) {
        throw new Error("REGISTRATION_FIELD_NOT_FOUND");
    }

    // 3. Check whether participants have already answered
    if (options !== undefined) {
        const answerCount = await tx.registrationAnswer.count({
            where: {
                fieldId
            }
        });

        if (answerCount > 0) {
            throw new Error("FIELD_ALREADY_ANSWERED");
        }
    }

    // 4. Update the field inside the transaction
    return tx.registrationField.update({
        where: {
            id: fieldId
        },
        data: {
            ...(label !== undefined && { label: label.trim() }),
            ...(required !== undefined && { required }),
            ...(placeholder !== undefined && { placeholder }),
            ...(options !== undefined && { options }),
            ...(order !== undefined && { order })
        }
    });
});

return res.status(200).json({
    message: "Registration field updated successfully",
    field: updatedField
});

       } catch (error) {
        if (error instanceof Error) {
            if (error.message === "REGISTRATION_FIELD_NOT_FOUND") {
                return res.status(404).json({
                    message: "Registration field not found"
                });
            }
            if (error instanceof Error) {
    if (error.message === "EVENT_NOT_FOUND") {
        return res.status(404).json({
            message: "Event not found"
        });
    }

    if (error.message === "NOT_ORGANIZER") {
        return res.status(403).json({
            message: "You are not the organizer of this event"
        });
    }

    if (error.message === "EVENT_NOT_MODIFIABLE") {
        return res.status(400).json({
            message: "Cannot modify registration fields of a rejected or cancelled event"
        });
    }
}

            if (error.message === "FIELD_ALREADY_ANSWERED") {
                return res.status(400).json({
                    message: "Cannot change options after users have answered this field"
                });
            }
        }

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
import { Router } from "express";

import {
    createRegistrationField,
    getRegistrationFields,
    updateRegistrationField,
    deleteRegistrationField
} from "../controllers/registrationFieldController";

import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

router.post(
    "/events/:eventId/registration-fields",
    authMiddleware,
    createRegistrationField
);
router.get(
    "/events/:eventId/registration-fields",
    authMiddleware,
    getRegistrationFields
);
router.patch("/events/:eventId/registration-fields/:fieldId", authMiddleware, updateRegistrationField);
router.delete(
  "/events/:eventId/registration-fields/:fieldId",
  authMiddleware,
  deleteRegistrationField
);

export default router;
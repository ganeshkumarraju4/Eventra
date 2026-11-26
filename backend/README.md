# Backend setup

## Post-event photo uploads

Organizer event-cover and post-event photo uploads use Cloudinary. Configure these variables in the backend
`.env` file before uploading photos:

```env
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

The backend accepts JPEG, PNG, and WebP files up to 5 MB each, with up to 8
photos per event. Apply database changes with `npx prisma migrate deploy` from
the `backend` directory.

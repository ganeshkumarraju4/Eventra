# Eventra

Eventra is a full-stack web application for creating, managing, approving, and registering for events. It supports role-based workflows for users and administrators, venue availability checks, dynamic registration forms, and post-event content.

## Features

- JWT-based user registration and login
- Role-based access for users and administrators
- Event creation and administrator approval/rejection workflows
- Event change requests and cancellation workflows
- Venue management with capacity and booking conflict validation
- Open or approval-required event registrations
- Dynamic, validated registration fields
- Participant capacity enforcement and duplicate-registration prevention
- User dashboards for events and registrations
- Event cover images and post-event photo galleries through Cloudinary
- Event ratings and feedback
- Responsive React interface

## Tech Stack

### Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Axios
- React Hook Form
- Zod
- Lucide React

### Backend

- Node.js
- Express.js
- TypeScript
- Prisma ORM
- MySQL/MariaDB
- JWT
- BCrypt
- Multer
- Cloudinary

## Project Structure

```text
Event-Manager/
├── frontend/               # React client application
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── types/
│   └── package.json
├── backend/                # Express API and Prisma data layer
│   ├── prisma/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   └── utils/
│   └── package.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm
- MySQL or MariaDB
- A Cloudinary account for image uploads

### 1. Clone the repository

```bash
git clone https://github.com/ganeshkumarraju4/Event-Manager.git
cd Event-Manager
```

### 2. Configure the backend

Create `backend/.env`:

```env
DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DATABASE"

JWT_SECRET="replace-with-a-long-random-secret"

CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

Install dependencies, generate the Prisma client, and apply migrations:

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
npm run dev
```

The API runs at `http://localhost:3001`.

### 3. Configure the frontend

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:3001/api
```

Install dependencies and start the development server:

```bash
cd ../frontend
npm install
npm run dev
```

The frontend runs at `http://localhost:5173`.

## Available Scripts

### Backend

```bash
npm run dev       # Start the API in watch mode
npm run build     # Generate Prisma client and compile TypeScript
npm start         # Run the compiled server
npm test          # Run tests
```

### Frontend

```bash
npm run dev       # Start the Vite development server
npm run build     # Type-check and build for production
npm run lint      # Run ESLint
npm run preview   # Preview the production build
```

## API Base URL

```text
http://localhost:3001/api
```

Main route groups:

- `/api/auth` - Authentication
- `/api/events` - Events and event workflows
- `/api/venues` - Venue management
- `/api/registrations` - Event registrations
- `/api/events/:eventId/registration-fields` - Dynamic registration fields

Protected endpoints require an `Authorization: Bearer <token>` header.

## Database

Prisma manages the MySQL/MariaDB schema and migrations. The schema includes users, venues, bookings, events, registrations, dynamic registration fields, feedback, change requests, and post-event content.

To create and apply new migrations during development:

```bash
cd backend
npx prisma migrate dev --name describe_your_change
```

## Contributing

1. Fork the repository.
2. Create a feature branch.
3. Make your changes and test both applications.
4. Open a pull request.

## License

This project is currently provided without an explicitly defined license.

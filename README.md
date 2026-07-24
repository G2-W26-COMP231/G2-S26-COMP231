# CrewUp

CrewUp is a MERN stack app that helps friend groups plan trips, events, and split shared expenses together. Built for COMP 231 (Software Engineering Technology) at Centennial College.

## What it does

- Create a group and invite your friends by email
- Plan events and RSVP (Going / Maybe / Can't make it)
- Group chat with real-time messaging (Socket.io)
- Log shared expenses and split them equally or custom
- Report inappropriate messages

## Tech stack

- **Frontend:** React (Vite)
- **Backend:** Node.js + Express
- **Database:** MongoDB (Mongoose)
- **Real-time:** Socket.io
- **Email:** SendGrid (for invite emails)
- **Auth:** JWT

## Getting started

### 1. Clone the repo

```bash
git clone https://github.com/G2-W26-COMP231/G2-S26-COMP231.git
cd G2-S26-COMP231
```

### 2. Backend setup

```bash
cd backend
npm install
```

Create a `.env` file in `backend/` with:

MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
SENDGRID_API_KEY=your_sendgrid_key
SENDGRID_FROM_EMAIL=your_verified_sender_email


Then run it:

npm run dev

Server runs on `http://localhost:5000`.

### 3. Frontend setup

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

App runs on `http://localhost:5173`.

## Seeding demo data

If you want to skip making an account and just try the app with fake data already in it, run:

```bash
cd backend
node -e "require('./utils/seedData').seedDatabase().then(() => process.exit(0))"
```

This creates a demo group ("Alberta Trip 2026") with 6 users, some events, chat messages, and expenses already in it.

**Demo login (all accounts use the same password):**

| Email | Password |
|---|---|
| albueraandrew@gmail.com | Demo1234! |
| milad@demo.com | Demo1234! |
| aadil@demo.com | Demo1234! |
| dang@demo.com | Demo1234! |
| czarina@demo.com | Demo1234! |
| hunee@demo.com | Demo1234! |

## Running tests

Backend tests:

```bash
cd backend
npm test
```

We're using Node's built-in test runner (`node:test`), no extra framework needed. Test files live in `backend/test/`.

## Team

| Name | Role |
|---|---|
| Andrew Albuera | Scrum Master / Agile Customer |
| Milad Nazari | Developer |
| Czarina Taborada | Developer |
| Aadil Syed | Developer |
| Dang Huy Cao | Developer |
| Hunee Park | Developer |

## Deployment

Deploying the app to a live environment (Render, etc.) is the Scrum Master's responsibility for this project once all iterations is finished, per our team's workflow decision.

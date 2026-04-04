# SplitMint AI

SplitMint AI is a full-stack expense splitting application built for shared spending across trips, flatmates, and group activities. It allows users to create groups, add participants, track expenses, calculate balances, and view settlement suggestions through a clean dashboard interface.

## Features

- User registration and login
- Group creation, editing, and deletion
- Add, edit, and remove participants
- Expense tracking with:
  - Equal split
  - Custom amount split
  - Percentage split
- Automatic balance calculation
- Minimal settlement suggestions
- Expense search and filtering
- Group summaries and dashboard insights
- Optional AI-based expense parsing and summaries

## Tech Stack

### Frontend
- Next.js
- React
- Tailwind CSS

### Backend
- Node.js
- Express.js
- Prisma ORM
- PostgreSQL

## Project Structure

Splitmint_AI/
├── backend/
│   ├── controllers/
│   ├── services/
│   ├── routes/
│   ├── prisma/
│   └── server.js
├── frontend/
│   ├── pages/
│   ├── components/
│   ├── lib/
│   └── styles/
└── README.md

Setup Instructions
1. Clone the repository
bash

git clone https://github.com/RGscripts/Splitmint_AI.git
cd Splitmint_AI
2. Setup backend
bash

cd backend
npm install
Create a .env file inside backend/ and add:

env

DATABASE_URL=your_database_url
JWT_SECRET=your_jwt_secret
PORT=5000
Run Prisma and start the backend:

bash

npx prisma generate
npx prisma db push
npm run dev
3. Setup frontend
Open a new terminal:

bash

cd frontend
npm install
Create a .env.local file inside frontend/ and add:

env

NEXT_PUBLIC_API_URL=http://localhost:5000
Start the frontend:

bash

npm run dev
Usage
Register a new account or log in
Create a group
Add participants
Add expenses and choose a split mode
View balances, summaries, and settlements
Use MintSense AI for optional expense parsing and insights
Notes
Environment files are excluded from version control using .gitignore
This project was built as part of an engineering internship challenge




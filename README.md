# AI Flashcard Generator

A full-stack AI-powered flashcard application that generates smart flashcards from PDFs, YouTube videos, and text using Google Gemini.

## Project Structure

```
/
├── src/                  # Frontend (React + TypeScript + Material UI)
├── backend/              # Backend (Node.js + Express + TypeScript + MongoDB)
├── ai_service/           # AI Service (Python + FastAPI + Gemini)
└── README.md
```

## Tech Stack

- **Frontend:** React 19, TypeScript, Material UI (MUI), React Router, Axios
- **Backend:** Node.js, Express, TypeScript, MongoDB (Mongoose), JWT
- **AI Service:** Python, FastAPI, Google Gemini 1.5 Flash
- **SRS Algorithm:** SM-2 (SuperMemo 2)

## Features

- Multi-input AI flashcard generation (PDF, YouTube, Text)
- Spaced Repetition System (SM-2 algorithm)
- JWT-based authentication
- Dark/Light mode toggle
- Flip card animations with keyboard shortcuts
- Deck management with tags and search
- Dashboard with stats and streak tracking

## Environment Setup

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
```

### Backend (backend/.env)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ai_flashcard_db
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d
AI_SERVICE_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

### AI Service (ai_service/.env)
```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=8000
CACHE_TTL_SECONDS=3600
MAX_PDF_PAGES=50
MAX_FLASHCARDS_PER_REQUEST=30
```

## Getting Started

### 1. Start MongoDB
Make sure MongoDB is running locally on port 27017, or update `MONGODB_URI` in `backend/.env`.

### 2. Start the Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

### 3. Start the AI Service

```bash
cd ai_service
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Add your GEMINI_API_KEY to .env
python main.py
```

Get your Gemini API key at: https://aistudio.google.com/app/apikey

### 4. Start the Frontend

```bash
npm install
cp .env.example .env
npm run dev
```

The app will be available at `http://localhost:5173`.

## API Routes

### Authentication (`/api/auth`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/signup` | Create new account |
| POST | `/login` | Sign in |
| GET | `/me` | Get current user (auth required) |

### Decks (`/api/decks`) — All require auth
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Get all decks |
| POST | `/` | Create deck |
| GET | `/stats/dashboard` | Dashboard stats |
| GET | `/:id` | Get single deck |
| PUT | `/:id` | Update deck |
| DELETE | `/:id` | Delete deck + all cards |

### Flashcards (`/api/flashcards`) — All require auth
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Get flashcards (`?deckId=`, `?dueOnly=true`, `?search=`) |
| POST | `/` | Create flashcard |
| POST | `/bulk` | Bulk create flashcards |
| PUT | `/:id` | Update flashcard |
| DELETE | `/:id` | Delete flashcard |
| POST | `/:id/review` | Record review (`{ rating: "again"|"hard"|"good"|"easy" }`) |

### AI Generation (`/api/ai`) — All require auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/generate/text` | From text (`{ text, difficulty, count }`) |
| POST | `/generate/pdf` | From PDF (multipart: `pdf`, `difficulty`, `count`) |
| POST | `/generate/youtube` | From YouTube (`{ url, difficulty, count }`) |

## Keyboard Shortcuts (Study Mode)

| Key | Action |
|-----|--------|
| Space / Enter | Flip card |
| 1 | Again |
| 2 | Hard |
| 3 | Good |
| 4 | Easy |

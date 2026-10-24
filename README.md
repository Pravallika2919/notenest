# NoteNest: Full-Stack Study Notes and Resource Management Platform (MERN)

Students sign up, create notes per subject, search, pin/favorite, attach PDFs, read notes in a reader view, and track exam countdowns. Every student sees only their own data (JWT authentication).

## Run
```bash
# Terminal 1: API
cd server
copy .env.example .env      # Windows   (Mac/Linux: cp .env.example .env)
npm install
npm run seed                # demo user + sample data (demo@notenest.com / demo123)
npm run dev                 # http://localhost:5000

# Terminal 2: Website
cd client
npm install
npm run dev                 # http://localhost:5173
```

## API
Auth: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`.
All `/api/notes` and `/api/subjects` routes require `Authorization: Bearer <token>`.

| Method | Route | Purpose |
|---|---|---|
| GET/POST | /api/subjects | list / create subject |
| PUT/DELETE | /api/subjects/:id | update / delete subject |
| GET | /api/notes?q=&subject=&favorite=true | list + search + filter |
| GET | /api/notes/recent | 5 latest updated notes |
| POST | /api/notes | create note |
| PUT/DELETE | /api/notes/:id | update / delete note |
| POST | /api/notes/:id/files | upload PDF/image (field `file`) |

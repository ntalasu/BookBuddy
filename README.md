# BookBuddy
The overall goal of BookBuddy is to use current technology to create a fun, personalized reading experience that encourages children to develop stronger and more consistent reading habits.

## Project structure
- `frontend/` — React + TypeScript app built with Vite and styled with Tailwind CSS
- `backend/` — Python API built with FastAPI, using a SQLite database (`books.db`), WorkOS for sign-in, and the Google Books API for book data

To use the app you need **both** the backend and the frontend running, each in its own terminal window.

## Prerequisites
- [Node.js](https://nodejs.org/) (LTS version)
- [Python](https://www.python.org/) 3.10 or newer
- [Git](https://git-scm.com/)
- A [WorkOS](https://workos.com/) account (for sign-in) and a [Google Books API key](https://developers.google.com/books/docs/v1/using#APIKey)

## First-time setup

### 1. Clone the project
```bash
git clone https://github.com/ntalasu/BookBuddy.git
cd BookBuddy
```

### 2. Set up the backend
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate        # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Create a file called `.env` inside `backend/` with these values:
```
GOOGLE_BOOKS_API_KEY=your-google-books-api-key
WORKOS_API_KEY=your-workos-api-key
WORKOS_CLIENT_ID=your-workos-client-id
WORKOS_REDIRECT_URI=http://localhost:8000/auth/callback
WORKOS_COOKIE_PASSWORD=any-long-random-string
```
- The WorkOS API key and client ID are in the WorkOS dashboard under **API Keys**.
- In the WorkOS dashboard, add `http://localhost:8000/auth/callback` as a redirect URI so it matches `WORKOS_REDIRECT_URI`.
- `WORKOS_COOKIE_PASSWORD` can be any random string of at least 32 characters (for example, run `openssl rand -base64 32`).
- Never commit `.env` — it holds secret keys and is already listed in `.gitignore`.

The backend will not start if any of the WorkOS values are missing.

### 3. Set up the frontend
```bash
cd ../frontend
npm install
```

## Running the app

### Terminal 1 — start the backend
From the `backend/` folder:
```bash
source .venv/bin/activate        # On Windows: .venv\Scripts\activate
uvicorn main:app --reload
```
The API runs at http://localhost:8000 (interactive docs at http://localhost:8000/docs). The database file `books.db` is created automatically the first time it starts.

### Terminal 2 — start the frontend
From the `frontend/` folder:
```bash
npm run dev
```
Then open http://localhost:5173 in your browser. The page reloads automatically when you save a file.

Press `Ctrl+C` in each terminal to stop the servers.

## Getting the latest changes
```bash
git pull

cd backend
source .venv/bin/activate
pip install -r requirements.txt   # only needed if someone added a new package

cd ../frontend
npm install                       # only needed if someone added a new package
```

## Notes
- Run `npm` commands inside `frontend/` and Python/`uvicorn` commands inside `backend/` (with the virtual environment activated).
- Use `http://localhost:5173`, not `127.0.0.1:5173` — sign-in redirects and cookies are set up for `localhost`.
- Sign-in, student profiles, and reading progress (minutes, streaks, badges) always use the real backend. Book recommendations and chat replies still use fake data for now (controlled by `USE_MOCK` in `frontend/src/api/ApiClient.ts`).
- Badges are defined in `backend/services/badges.py`. To add one, add a line to `BADGES`.
- The frontend talks to the backend at `http://localhost:8000` by default.

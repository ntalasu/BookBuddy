# BookBuddy
The overall goal of BookBuddy is to use current technology to create a fun, personalized reading experience that encourages children to develop stronger and more consistent reading habits.

## What's in the app
- **Discover**: search for books and keep a bookshelf with three shelves: Want to Read, Reading Now, and Finished. Kids can rate a book (1–5 stars, plus their favorite part) when they finish it.
- **Progress**: a reading timer, total minutes, a daily reading streak, a "My Books" summary, and badges that unlock hats and items for the kid's reading buddy.
- **Chat**: Buddy, a reading chatbot that recommends books that fit the kid's age, reading level, and interests, answers questions about books, and explains tricky words (see [Buddy, the reading chatbot](#buddy-the-reading-chatbot)).
- **Profile**: the kid's age, reading level, interests, and reading buddy (character, hat, item, colors).

## Project structure
- `frontend/` — React + TypeScript app built with Vite and styled with Tailwind CSS
  - `src/ai/` — Buddy, the chatbot (runs in the browser)
- `backend/` — Python API built with FastAPI, using a SQLite database (`books.db`) and WorkOS for sign-in
  - `services/google_books.py` — book search and details from the Google Books API
  - `services/recommendations.py` — book recommendations for Buddy (Open Library + Google Books)
  - `services/badges.py` — reading badges and streaks

To use the app you need **both** the backend and the frontend running, each in its own terminal window.

## Prerequisites
- [Node.js](https://nodejs.org/) (LTS version)
- [Python](https://www.python.org/) 3.10 or newer
- [Git](https://git-scm.com/)
- A [WorkOS](https://workos.com/) account (for sign-in) and a [Google Books API key](https://developers.google.com/books/docs/v1/using#APIKey)
- **Chrome or Edge** on a newer computer, for Buddy's full AI chat. Other browsers and older devices still work, with Buddy's simple chat.

Open Library and the Free Dictionary API are also used, but they're free and don't need a key.

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

## Buddy, the reading chatbot

### How it works
- **The AI runs in the kid's browser**, using [WebLLM](https://webllm.mlc.ai/) and a small model (Llama 3.2 1B). That means it's free, has no message limit, and **chat messages never leave the kid's device**.
- **The first time** someone opens Chat, the browser downloads the model (about 0.7 GB). After that it's saved by the browser and loads in a few seconds.
- **Kids can chat right away.** While the AI loads, Buddy's simple chat answers (see below), and Buddy switches to the AI when it's ready.
- **If a device can't run the AI**, Buddy uses its simple chat instead. This happens on browsers without WebGPU, like Safari and Firefox, and on older devices, or if the AI stops working mid-chat. The simple chat still gives real book recommendations, book lookups, and word meanings, with buttons to tap.

### Keeping Buddy accurate
A 1B model makes things up, so the code decides most things and the AI only puts them into kid-friendly words:
- **Book picks come from the backend** (`GET /books/recommendations`). It finds popular kids' books on the topic with Open Library, adds more from Google Books, reads each book's description, and only keeps books that:
  - are really about the topic;
  - fit the kid's age and reading level;
  - match their profile interests;
  - pass the content checks (no teen or grown-up books, nothing violent for younger kids, nothing self-published).
- **The code writes the title and author** ("Try *Dog Man* by Dav Pilkey!"), so they always match the book card.
- **Everything the AI says about a book is fact-checked** against the book's real description. Sentences that don't match are removed, and sentences that name made-up books are removed too.
- **Word meanings come from the [Free Dictionary API](https://dictionaryapi.dev/)**, and the AI only rewords them for kids.

Only a topic word (like "dragon") or a short book title is ever sent to Google Books or Open Library, never a kid's whole message.

### Trying it
- Open http://localhost:5173/chat in Chrome or Edge.
- To try the simple chat on any device, add `?simple`: http://localhost:5173/chat?simple
- The first time you ask about a new topic, it can take 10–30 seconds while the backend reads book descriptions. After that it's quick (until the backend restarts).

### Where to change things
| To change… | Edit |
|---|---|
| Buddy's rules and personality | `frontend/src/ai/buddyInstructions.ts` |
| The AI model | `frontend/src/ai/buddyModel.ts` (one line) |
| Topics Buddy understands ("dinos", "spooky"…) | `topics` in `frontend/src/ai/bookFinder.ts` |
| Simple-chat replies ("hi", "I'm bored"…) | `frontend/src/ai/simpleReplies.ts` |
| How books are picked and filtered (ages, content checks) | `backend/services/recommendations.py` |

## Notes
- Run `npm` commands inside `frontend/` and Python/`uvicorn` commands inside `backend/` (with the virtual environment activated).
- Use `http://localhost:5173`, not `127.0.0.1:5173` — sign-in redirects and cookies are set up for `localhost`.
- Everything uses the real backend. (`USE_MOCK` in `frontend/src/api/ApiClient.ts` only affects the old, unused `BookApiService.ts`.)
- Badges are defined in `backend/services/badges.py`. To add one, add a line to `BADGES`.
- The frontend talks to the backend at `http://localhost:8000` by default.
- **Google Books limit:** the API key allows a limited number of requests per day (usually 1,000), and Buddy's recommendations use a lot of them. If book searches stop working for the rest of the day, that's probably why. You can check or raise the limit in the Google Cloud Console under *APIs & Services → Books API → Quotas*.

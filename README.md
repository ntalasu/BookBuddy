# BookBuddy
The overall goal of BookBuddy is to use current technology to create a fun, personalized reading experience that encourages children to develop stronger and more consistent reading habits.

## Running the frontend

The frontend is a React + TypeScript app built with Vite and styled with Tailwind CSS. It lives in the `frontend/` folder.

### Prerequisites
- [Node.js](https://nodejs.org/) (LTS version)
- [Git](https://git-scm.com/)

### First-time setup
```bash
git clone https://github.com/ntalasu/BookBuddy.git
cd BookBuddy/frontend
npm install
```

### Start the app
From the `frontend/` folder:
```bash
npm run dev
```
Then open http://localhost:5173 in your browser. The page reloads automatically when you save a file. Press `Ctrl+C` in the terminal to stop it.

### Getting the latest changes
```bash
git pull
cd frontend
npm install   # only needed if someone added a new package
```

### Notes
- All `npm` commands must be run inside `frontend/`, not the main `BookBuddy/` folder.
- Books, chat replies, and badges currently use fake data, so the app works without the backend running.

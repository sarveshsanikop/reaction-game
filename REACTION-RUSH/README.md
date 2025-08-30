# Reaction Speed — Mini Game (React + Vite + Tailwind + Framer Motion)

**Description**
A mobile-friendly reaction speed mini-game. Click/tap the target before the timer runs out. Difficulty ramps up each round by shortening the allowed time. Best score is saved in `localStorage`. A mock leaderboard is provided via a JSON stub.

**Features**
- React + Vite project (JavaScript)
- Tailwind CSS styling
- Framer Motion animations
- Score tracking and best score saved in `localStorage`
- Pause / Resume, Start, Restart controls
- Mock leaderboard (public/mock-leaderboard.json) + local leaderboard saved on restart
- Simple sound feedback using Web Audio API

**How to run locally**
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start dev server:
   ```bash
   npm run dev
   ```
3. Open the shown Vite URL (usually http://localhost:5173)

**Build for production**
```bash
npm run build
npm run preview
```

**Deployment (Vercel / Netlify)**
- Push repository to GitHub.
- For Vercel: Import the repo, use default settings (Framework: Vite). Build command `npm run build`, Output dir `dist`.
- For Netlify: Link repo, build command `npm run build`, publish `dist`.

**Controls**
- Start: Begin the game
- Pause / Resume: Pause the active round
- Stop: End the current run
- Restart: Saves your current score to the local leaderboard and restarts

**Deliverables checklist**
- [ ] Live demo URL (deploy to Vercel/Netlify)
- [ ] GitHub repo (push project)
- [ ] 30–60s demo video: Suggestion — record your screen showing Start, a few rounds, Pause/Resume, and Restart saving score.
- [x] README (this file)
- [x] Local ZIP (this package)

**Suggested demo script (30–60s)**
1. Show title and controls briefly (5s).
2. Press Start, play a few rounds to show increasing speed (20s).
3. Pause and resume to demonstrate pause state (5s).
4. Restart and show local leaderboard updated (10s).
5. Mention where to find code & deploy steps (5s).

**Known limitations**
- Leaderboard is a stub + local store saved to browser localStorage. For a full backend you'd replace `public/mock-leaderboard.json` with an API.
- Target position is animated within the play area — further polish could snap to a grid and better mobile hit testing.

**Author**
Vaibhav (assignment submission)


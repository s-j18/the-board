# The Board

A multiplayer football tile-claiming game. Select touching tiles, name a footballer who connects them all, and claim points. Steal opponent tiles if you gain more blank tiles than you steal.

Supports 1–4 players, variable board sizes (3×3 up to 12×12), and live multiplayer via PartyKit WebSockets.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend + API routes | Next.js 14 (App Router) |
| Real-time multiplayer | PartyKit |
| Player database | Transfermarkt API (self-hosted) |
| Hosting | Vercel (Next.js) + PartyKit cloud |

---

## Setup guide (step by step)

### Step 1 — Install Node.js

If you don't have Node.js installed, download it from https://nodejs.org and install the LTS version.

To check it's working, open a terminal and run:
```
node --version
```
You should see something like `v20.x.x`.

---

### Step 2 — Get the code onto your machine

Option A — if you have Git:
```bash
git clone https://github.com/YOUR_USERNAME/the-board.git
cd the-board
```

Option B — download the ZIP from GitHub and unzip it, then open a terminal in that folder.

---

### Step 3 — Install dependencies

In your terminal, inside the project folder:
```bash
npm install
```

This downloads all the libraries the project needs. It may take a minute.

---

### Step 4 — Set up your environment variables

Copy the example file:
```bash
cp .env.local.example .env.local
```

Then open `.env.local` in any text editor. You'll fill in the values in the steps below.

---

### Step 5 — Set up Upstash Redis (free)

Upstash is a free Redis database used for caching player lookups.

1. Go to https://upstash.com and create a free account
2. Click **Create Database**
3. Choose a name (e.g. `the-board`), pick the region closest to you, click **Create**
4. On the database page, scroll to **REST API** and copy:
   - `UPSTASH_REDIS_REST_URL` → paste into `.env.local`
   - `UPSTASH_REDIS_REST_TOKEN` → paste into `.env.local`

---

### Step 6 — Set up the Transfermarkt API

The player database comes from a free open-source Transfermarkt scraper.

**Option A — use the public instance (easiest, has rate limiting):**

Leave `TRANSFERMARKT_API_URL` in `.env.local` as:
```
TRANSFERMARKT_API_URL=https://transfermarkt-api.fly.dev
```

This works for testing but may be slow under heavy use.

**Option B — self-host your own instance (recommended for production):**

You'll need Docker installed (https://docker.com).

```bash
# Pull and run the Transfermarkt API locally
docker run -d -p 8000:8000 felipeall/transfermarkt-api:latest

# Test it's working
curl http://localhost:8000/players/search/wayne%20rooney
```

For deploying to Railway (free tier):
1. Go to https://railway.app and create a free account
2. Click **New Project → Deploy from Docker Image**
3. Enter image: `felipeall/transfermarkt-api`
4. Once deployed, copy the public URL and paste it as `TRANSFERMARKT_API_URL` in `.env.local`

---

### Step 7 — Run locally

```bash
npm run dev
```

This starts both Next.js (http://localhost:3000) and PartyKit (http://localhost:1999) at the same time.

Open http://localhost:3000 in your browser. You should see the home screen.

To test multiplayer locally, open the same room URL in two different browser tabs.

---

### Step 8 — Deploy to Vercel

1. Push your code to a GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/the-board.git
   git push -u origin main
   ```

2. Go to https://vercel.com and log in with your GitHub account

3. Click **Add New → Project**, select your `the-board` repository

4. In the **Environment Variables** section, add all four variables from your `.env.local`:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
   - `TRANSFERMARKT_API_URL`
   - `NEXT_PUBLIC_APP_URL` → set this to your Vercel app URL (e.g. `https://the-board.vercel.app`)

5. Click **Deploy** and wait ~2 minutes

---

### Step 9 — Deploy PartyKit

PartyKit handles the real-time WebSocket connections for multiplayer.

```bash
# Install PartyKit CLI globally
npm install -g partykit

# Log in (opens browser)
npx partykit login

# Deploy
npx partykit deploy
```

After deploying, PartyKit will give you a URL like:
```
https://the-board.YOUR_USERNAME.partykit.dev
```

Go back to Vercel → your project → **Settings → Environment Variables** and add:
```
NEXT_PUBLIC_PARTYKIT_HOST=the-board.YOUR_USERNAME.partykit.dev
```

Then go to **Deployments** and click **Redeploy** so Vercel picks up the new variable.

---

### Step 10 — You're live!

Share your Vercel URL with friends. They can join your room using the 5-letter room code shown in the lobby.

---

## Board size guide

| Size | Tiles | Best for |
|---|---|---|
| 3×3 | 9 | Quick 2-player game |
| 5×5 | 25 | Standard game (default) |
| 7×7 | 49 | Long game, 3–4 players |
| 10×10 | 100 | Epic game, 4 players |

---

## Project structure

```
the-board/
├── app/
│   ├── page.tsx              ← Home screen (create/join room)
│   ├── room/[roomId]/        ← Game room page
│   ├── components/           ← Board, PlayerInput, Scoreboard, etc.
│   └── api/                  ← Next.js API routes
│       ├── player/search/    ← Player autocomplete endpoint
│       └── board/            ← Board generation endpoint
├── party/
│   └── index.ts              ← PartyKit server (multiplayer logic)
├── lib/
│   ├── types.ts              ← Shared TypeScript types
│   ├── board.ts              ← Tile pool + board generator
│   ├── game.ts               ← Claim validation, scoring, turn logic
│   └── player.ts             ← Transfermarkt API client + normalisation
└── .env.local.example        ← Environment variable template
```

---

## Troubleshooting

**"Player not found" for valid players**
The Transfermarkt API public instance can be slow. Try again, or self-host your own instance (Step 6, Option B).

**Tiles not connecting when they should**
The contiguity check is horizontal/vertical only — diagonal tiles do not count as touching.

**Multiplayer not syncing**
Make sure `NEXT_PUBLIC_PARTYKIT_HOST` is set correctly in Vercel and you've redeployed after adding it.

**Board size error**
The maximum board is 12×12 = 144 tiles. The tile pool currently has ~90 tiles, so boards above ~9×10 will error. More tiles can be added to `lib/board.ts`.

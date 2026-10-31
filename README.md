# GameZone 🎮

**Free Browser Games — Play Instantly, No Download**

GameZone is a pure static arcade website: 10 classic games you can play right in the
browser. No build step, no external CDN dependencies, no sign-up, no downloads.
Best scores are saved in your browser (localStorage), so they survive page reloads
on the same device.

## The 10 Games

| Game | How it plays |
|---|---|
| 🍉 Fruit Slice | Swipe/drag to slice flying fruit. Bombs cost a life — 3 lives, combo bonus for multi-slices. |
| 🐍 Snake | Arrow keys / WASD or on-screen d-pad. Eat food, grow, speed up every 5 foods. Don't hit a wall or yourself. |
| 🎈 Flappy Ball | Click, tap or Space to flap through pipe gaps. +1 per pipe passed, pipes get faster. |
| 🃏 Memory Match | 4×4 grid, 8 pairs. Flip two cards at a time; fewest moves wins. Moves + timer shown. |
| 🧱 Breakout | Move the paddle (mouse / arrows / touch) and smash all 3 rows of bricks. 3 lives. |
| 🔨 Whack-a-Mole | 30-second round, 3×3 grid. +1 per mole hit, −1 for tapping an empty hole. |
| 🔢 2048 | Arrow keys or swipe to slide tiles. Equal tiles merge once per move. Reach 2048 to win. |
| 💣 Minesweeper | 9×9 field, 10 mines. Left-click to reveal, right-click / long-press to flag. First click is always safe. |
| ❌ Tic-Tac-Toe | Vs computer (it blocks and wins when it can) or 2-player mode on the same screen. |
| 💨 Dodge Dash | Move left/right (arrows or drag) to dodge falling blocks. Score = seconds survived; it only gets faster. |

Every game page has a start screen with How to Play, a live score display, a pause
button (on real-time games), and a game-over screen with your score, best score and
a Play Again button.

## Project Structure

```
game-arcade/
├── index.html            # Hub: hero, live search, category filters, game cards
├── README.md
├── assets/
│   ├── style.css         # One shared stylesheet for hub + all games
│   ├── shell.js          # Sound toggle (WebAudio beeps) + best-score helpers
│   └── games/            # One JS file per game
│       ├── fruit-slice.js  snake.js  flappy.js  memory.js  breakout.js
│       ├── whack.js  2048.js  minesweeper.js  tictactoe.js  dodge.js
└── games/                # One HTML page per game
    ├── fruit-slice.html  snake.html  flappy.html  memory.html  breakout.html
    ├── whack.html  2048.html  minesweeper.html  tictactoe.html  dodge.html
```

## Run Locally

Just open `index.html` in any modern browser — everything works from local files.

Or serve it over HTTP (recommended for the cleanest behaviour):

```bash
cd game-arcade
python3 -m http.server 8000
# then open http://localhost:8000
```

## Deploy (Vercel)

This is a static site — deploy the `game-arcade` folder as-is:

1. Import the folder (or its Git repo) into Vercel as a new project.
2. No build command, no output directory, no environment variables — framework
   preset: **Other**.
3. Deploy. Every page works over HTTPS with no changes.

## AdSense (later)

The site is ad-ready by design: there is an `<!-- AdSense ready -->` comment in
`index.html` marking where the first ad slot will go. Do **not** add any ad code
until the site has real traffic — AdSense approval needs genuine visitors and
content first. When the time comes, paste the AdSense script + ad unit in the
marked spot (and add a `privacy-policy.html` page, which AdSense requires).

## Notes

- All text is in English; the site is for a general audience.
- Sound is tiny WebAudio beeps with an on/off toggle in the header (no audio files).
- Best scores use `localStorage` keys like `gamezone_best_snake` (per game).
- Works on desktop (keyboard + mouse) and mobile (touch + on-screen controls).

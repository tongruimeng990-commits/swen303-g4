# vuw clubs. — SWEN303 Group 4

## Run it

Requires Node.js 22.18+ (including the built-in TypeScript support used by tests).

```sh
npm install
npm run dev
```

Open http://localhost:5173/

- `/` — homepage (find a club, catch it into your pile, ask the stone golem)
- `/editorial/<slug>` — a club's page, e.g. `/editorial/vicfolk`, `/editorial/vuwtc`, `/editorial/debsoc`

## Other commands

```sh
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build locally
npm test           # calendar dates, email draft encoding, pile return geometry
```

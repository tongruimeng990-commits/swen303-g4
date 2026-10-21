# vuw clubs. — SWEN303 Group 4

## Run it

Requires Node.js 22.18+ (including the built-in TypeScript support used by tests).

```sh
npm install
npm run dev
```

Open http://localhost:5173/

- `/` — homepage (find a club, save it to my clubs, ask the stone golem)
- `/clubs` — separate club list with the existing search, filters and saved clubs
- `/clubs?q=folk+thursday` — shareable initial search; homepage search submits here
- `/editorial/<slug>` — a club's page, e.g. `/editorial/vicfolk`, `/editorial/vuwtc`, `/editorial/debsoc`

The reference refresh uses locally hosted Inter and Krub fonts in `public/fonts/`.
Their SIL Open Font Licenses are included alongside them. Colours and layout
overrides are in `src/reference-theme.css`; the existing interaction components
remain responsible for search, saving, video, forms and scroll effects.

## Repository layout

- `src/` — the website (React, TypeScript, Vite); club content is in `src/content/`
- `public/` — club photos, posters and fonts
- `tests/` — unit tests (`npm test`)
- `file/` — hand-in documents
  - `1_Cover_and_Agreement/` — cover page with contributions, team agreement
  - `2_Reports/` — research, Iteration 1 and Iteration 2 reports (PDF)
  - `3_Wireframes/` — Excalidraw wireframes (Iteration 1) and Figma file (Iteration 2)

Participant materials are not in this repository. They are shared with the teaching team in the OneDrive zip linked on the cover page ([SWEN303_Group4_Files.zip](https://myvuwac-my.sharepoint.com/:u:/g/personal/tongruim_myvuw_ac_nz/IQCJ9EnvsrFvSIk3MMMsgVOEASpqOBBS3c-Za_R25umaFgs?e=PKi2zb), VUW sign-in required), under `file/4_Participants/<participant>/`:

- `Transcripts/` — interview transcript and user test transcript
- `Consent_Forms/` — interview consent form and user testing consent form

## References

Related work

- Iasondesign, "Brunel Union: making it simple for students to join societies," UX case study, Brunel University London. https://iasondesign.framer.website/Brunel-Union/

Methods and design

- J. Nielsen, "10 Usability Heuristics for User Interface Design," Nielsen Norman Group, 1994, updated 2020. https://www.nngroup.com/articles/ten-usability-heuristics/
- J. Nielsen, "Progressive Disclosure," Nielsen Norman Group, 2006. https://www.nngroup.com/articles/progressive-disclosure/
- Coolors, colour palette generator. https://coolors.co/
- Figma, "Font pairings." https://www.figma.com/resource-library/font-pairings/
- Inter and Krub typefaces, SIL Open Font License. https://fonts.google.com/specimen/Inter, https://fonts.google.com/specimen/Krub

Club content and media

Club details, photos and videos come from each club's public pages; credits are shown on each video in the site.

- Victoria University of Wellington, Clubs and societies directory. https://www.wgtn.ac.nz/recreation/clubs-and-societies/directory
- VUCC, Victoria University Canoe Club. https://vucc.nz/
- VicFolk. https://vicfolkmusic.wordpress.com/
- VUWTC, Victoria University of Wellington Tramping Club. https://www.vuwtc.org.nz/
- Vic Debsoc. https://www.vicdebsoc.org.nz/
- Mukume Taiko Drummers. https://www.wgtn.ac.nz/recreation/clubs-and-societies/directory/mukume-taiko-drummers, https://www.youtube.com/@MukumeTaiko
- Vic Uke. https://www.wgtn.ac.nz/recreation/clubs-and-societies/directory/vic-uke, https://www.youtube.com/@vicuke2837
- Event pages on Humanitix. https://events.humanitix.com/

## Other commands

```sh
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build locally
npm test           # calendar dates, email draft encoding, pile return geometry
```

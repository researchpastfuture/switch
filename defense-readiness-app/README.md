# American Defense Readiness 2030 — Interactive Edition

An interactive website that presents the white paper, lets visitors **search** it, **browse**
all 17 sections, use an **interactive tool in every section**, and build a personal
**research dossier** (highlights, notes, bookmarks) they can print or export.

It is a **standalone static website**. It does not depend on any other tool to run, and it
costs **$0 to host** on free static hosting. The only thing that ever costs money is the
optional one-time AI drafting step below (you run it yourself, with your own key, once).

---

## The two things you'll actually edit

You do **not** need to touch any of the framework code. Day to day, only two places matter:

1. **`content/sections/*.mdx`** — the text of each section (plain Markdown). One file per
   section. Edit the words below the `---` line; leave the part between the `---` lines alone.
2. **`src/data/tools/*.ts`** — the numbers, lists, and markers behind each interactive tool.
   To change a tool, add or edit a row — you never write code.

Every section also lists its title and one-line summary in **`src/data/toc.ts`** (this is the
master list that drives the menu, the homepage, and search).

---

## First-time setup

You need [Node.js](https://nodejs.org/) 22 or newer installed. Then, in a terminal:

```sh
cd defense-readiness-app
npm install        # one time — downloads what the site needs
npm run dev        # starts the site at http://localhost:4321
```

Leave `npm run dev` running and open **http://localhost:4321** in your browser. As you edit
files, the site updates automatically.

---

## Generating the section text with AI (optional, one time)

The sections ship with short placeholder text. To have AI write a full draft of every
section from its title:

```sh
cp .env.example .env          # makes your private settings file
# open .env and paste your key from https://console.anthropic.com/
npm run draft                 # writes a draft into every section
# (or draft just one: `npm run draft -- --only=15`)
```

This runs **once**. After it finishes, review the text in `content/sections/`, edit anything
you like, and you're done. **You never need the key again** to view, publish, or update the
site — the words are now saved in the files.

---

## Publishing it for free (Vercel)

1. Push this repository to GitHub (it already lives in one).
2. Go to [vercel.com](https://vercel.com), **Add New → Project**, and pick this repository.
3. **Important:** set **Root Directory** to `defense-readiness-app`.
4. Click Deploy. Vercel detects Astro automatically; no settings needed.

From then on, every time you push a change to GitHub, the live site updates by itself. No API
key is needed for deployment. (The same `dist/` output also works on Netlify, Cloudflare
Pages, or GitHub Pages if you ever want to move.)

---

## Commands

| Command            | What it does                                      |
| :----------------- | :------------------------------------------------ |
| `npm run dev`      | Preview the site locally while you edit           |
| `npm run draft`    | One-time AI drafting of section text (needs key)  |
| `npm run build`    | Produce the static site in `./dist/`              |
| `npm run preview`  | Preview the built site exactly as it will publish |

---

## How the pieces fit together

- `src/data/toc.ts` — master list of the 17 sections.
- `content/sections/*.mdx` — the prose for each section.
- `src/data/tools/*.ts` — editable data behind each interactive tool.
- `src/components/tools/` — the interactive widgets (one per section).
- `src/pages/` — the pages: home (`index.astro`), a section (`sections/[slug].astro`),
  the dossier (`dossier.astro`), and the printable full document (`print.astro`).
- Visitors' bookmarks, notes, highlights, and tool inputs are saved privately in their own
  browser — nothing is sent to a server.

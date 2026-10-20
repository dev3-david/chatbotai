# Travel assistant chatbot

A customer-facing Q&A chatbot for a tourism company. Admins maintain question/answer pairs per department in MongoDB; customers ask free-form questions and get the best-matching stored answer through vector search.

## Stack

- Next.js 16 (App Router, TypeScript, Tailwind)
- MongoDB Atlas (free M0 tier) with Atlas Vector Search
- Auth.js 5 with email/password for admins (`isAdmin` flag)
- Transformers.js with `paraphrase-multilingual-MiniLM-L12-v2` (384-dim embeddings, Hebrew + English + 50 more languages, runs locally, free)

## Setup

1. Start a database. Easiest: Docker, which also lets n8n and Compass connect:

   ```bash
   docker compose up -d mongo
   ```

   This runs MongoDB 8 on port 27018 with user `tourism` / password `tourism` and a persistent volume. Alternatively create a free cluster on [MongoDB Atlas](https://cloud.mongodb.com), add a database user and allow your IP under Network Access.
2. Copy the environment file and fill it in:

   ```bash
   cp .env.example .env.local
   ```

   Set `MONGODB_URI`, a random `AUTH_SECRET`, and `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

3. Install and seed:

   ```bash
   npm install
   npm run seed          # indexes, admin user, default departments
   npm run vector-index  # Atlas Vector Search index on qa.embedding
   ```

4. Run:

   ```bash
   npm run dev
   ```

   - Chat: http://localhost:3000
   - Admin: http://localhost:3000/admin (log in with the seeded admin)

The first question or save downloads the embedding model (about 120 MB, quantised) into `.cache/transformers`.

Questions and answers are written in Hebrew or English, in whichever language the admin types. Customers can ask in any language and match stored questions; the answer is returned exactly as written.

The UI is available in English (`/`), Hebrew (`/he`), Thai (`/th`) and Vietnamese (`/vi`). The language is detected from the browser on the first visit, and the switcher in the top bar of every page stores the choice in a one-year cookie, so the chat, login and admin pages all follow it. UI strings live in `messages/*.json`; add a key to `en.json` and the same key to the other three files.

## How it works

- `qa` collection: one entry per answer with `department`, `questions` (all the ways to ask it), `answer`, `tags`.
- `qa_questions` collection: one row per question variation with its `embedding` and `qaId`. The vector index lives here, so every phrasing is searchable and all lead to the same answer.
- Saving embeds new or changed variations only. Unchanged ones keep their vector.
- `/api/chat` embeds the customer's question and runs `$vectorSearch` on `qa_questions` across all departments, keeps the best variation per answer, and returns the top answer. Departments are an organisational tool for admins only. If the best cosine score is below `CONFIDENCE_THRESHOLD`, the bot says it has no answer yet.
- Changed `EMBEDDING_MODEL`? Run `npm run reembed` so stored vectors match the new model.
- Until the Atlas index exists (or on a local MongoDB), search falls back to in-process cosine similarity, so the whole flow works without Atlas.

## Scripts

| Command                | What it does                                   |
| ---------------------- | ---------------------------------------------- |
| `npm run dev`          | Start the dev server                           |
| `npm run build`        | Production build                               |
| `npm run seed`         | Indexes, admin user, default departments       |
| `npm run vector-index` | Create the Atlas Vector Search index           |
| `npm run dev-db`       | Throwaway in-memory MongoDB on port 27019 (no Docker needed; data lost on exit) |
| `npm run reembed`      | Re-embed all questions after a model change    |
| `npm run migrate`      | Upgrade older documents to the current shape   |
| `npm run typecheck`    | TypeScript check                               |

## Connecting n8n (or any external client)

Use the MongoDB node in n8n with a connection string:

| Where n8n runs                         | Connection string |
| -------------------------------------- | ----------------- |
| Same `docker compose --profile n8n`    | `mongodb://tourism:tourism@mongo:27017/tourism_bot?authSource=admin` |
| Another Docker container on this PC    | `mongodb://tourism:tourism@host.docker.internal:27018/tourism_bot?authSource=admin` |
| Installed directly on this PC          | `mongodb://tourism:tourism@127.0.0.1:27018/tourism_bot?authSource=admin` |
| n8n cloud / another machine            | Not reachable on localhost. Use Atlas, or expose the port through a tunnel. |

Collections: `qa` (questions[], answer, tags, department), `qa_questions` (text, embedding, qaId, department), `departments`, `users`.
Anything that writes `qa_questions.embedding` must use the same model as `EMBEDDING_MODEL`, or searches will not match.

## Roadmap

- v2: Google Workspace login (Auth.js Google provider, company domain only). `isAdmin` stays the gate.
- Live-data hook in `/api/chat` for questions like weather on specific dates.

# RunOut backend — Personal Fields API

Cloudflare Worker + D1 (SQLite at edge). Stores per-user personal fields
(purchase price, purchase date, location, personal notes, tags) that complement
the Discogs catalogue data.

**Auth model**: every request carries `Authorization: Discogs-Token <pat>`.
The Worker calls Discogs `/oauth/identity` to resolve the user's Discogs ID,
and scopes all data access by that ID. No accounts on our side, no passwords,
no session cookies.

**Encryption**: each row's `data` column is an AES-256-GCM encrypted JSON blob.
The key (`ENC_KEY`) is a Worker secret; it never leaves Cloudflare.

---

## Deploy

```bash
cd backend
npm install
npx wrangler login

# 1. Create the D1 database and paste the printed database_id into wrangler.toml.
npm run db:create

# 2. Apply the schema to the remote D1 instance.
npm run db:init

# 3. Generate and set the encryption key.
#    Keep a copy somewhere safe — losing it means unreadable rows.
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
npm run secret:enc
# Paste the hex string when prompted.

# 4. Deploy.
npm run deploy
```

After deploy, Wrangler prints a `*.workers.dev` URL. Plug that into the PWA's
`BACKEND_API` constant (in `index.html`) to enable the personal-fields UI.

For a cleaner URL, add a custom route in Cloudflare (e.g. `api.runout.io`) and
keep `ALLOWED_ORIGIN = "https://app.runout.io"` in `wrangler.toml`.

---

## Endpoints

All require `Authorization: Discogs-Token <pat>`. Response bodies are JSON.

| Method | Path                 | Body                                        | Returns                                           |
|--------|----------------------|---------------------------------------------|---------------------------------------------------|
| GET    | `/api/fields`        | —                                           | `{ [releaseId]: { ...fields, updated_at } }`      |
| GET    | `/api/fields/:id`    | —                                           | `{ ...fields, updated_at }` or `404`              |
| PUT    | `/api/fields/:id`    | `{ price?, currency?, purchase_date?, ... }` | `{ ok: true, updated_at }`                       |
| DELETE | `/api/fields/:id`    | —                                           | `{ ok: true }`                                    |

Field shape (all optional, whitelisted server-side):

```ts
{
  price?: number;
  currency?: string;       // ISO code, truncated to 8 chars
  purchase_date?: string;  // free-form, truncated to 32 chars
  location?: string;       // where you bought it
  notes?: string;          // up to 4000 chars
  tags?: string[];         // up to 32 items, each 64 chars
}
```

---

## Rate limiting

Each request triggers a Discogs `/oauth/identity` call to resolve the user.
Discogs allows 60 authenticated requests/min per token. For heavier write
scenarios add a small KV cache keyed on the token hash with a 5–10 min TTL.
Not needed for the POC.

---

## Key rotation

1. Generate a new key.
2. Write a migration script that reads all rows with the old key and
   re-encrypts with the new key. Keep both keys available during the window.
3. `wrangler secret put ENC_KEY` with the new value.
4. Delete the old key from anywhere it was stashed.

---

## Local development

```bash
npm run db:init:local   # initialise the local SQLite used by `wrangler dev`
npm run dev             # runs on http://localhost:8787
```

During local dev, set `ALLOWED_ORIGIN = "*"` in `wrangler.toml` (or an override
in `.dev.vars`) so the PWA can call it from `http://localhost` or file://.

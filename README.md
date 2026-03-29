# RunOut

A fast, mobile-friendly PWA for searching and managing your Discogs vinyl collection. Built for the record store — search by catalog number, see what you own, and add releases on the spot.

## Features

- **Unified search** — search by catalog number, barcode, or free text. Runs two searches in parallel: instant local search against your cached collection, and an API search against all of Discogs.
- **Owned releases on top** — your collection items appear first, highlighted in green with an "owned" badge. Non-owned releases are listed below.
- **Smart filters** — dynamic dropdowns for format, size (12"/7"/10"), year, and country, populated from search results. Size filter includes releases without size info.
- **Add with details** — add releases to your collection with folder, media condition, sleeve condition, and notes. Last used folder and media condition are remembered.
- **Collection caching** — your full collection is cached in localStorage for instant local searches. Manual refresh available.
- **PWA** — installable on your phone's home screen with offline support for the app shell.

## Getting started

1. Open `index.html` in a browser (or serve via any HTTP server for full PWA support)
2. Enter your [Discogs personal access token](https://www.discogs.com/settings/developers) and username
3. Your collection loads and is cached locally
4. Search away!

## Files

| File | Description |
|------|-------------|
| `index.html` | Entire app — HTML, CSS, and React JSX |
| `sw.js` | Service worker with cache-first strategy |
| `manifest.json` | PWA manifest |
| `icon-192.png` | App icon 192x192 |
| `icon-512.png` | App icon 512x512 |

## Tech stack

- React 18 + Babel (via CDN, no build step)
- Pure CSS, mobile-first
- Discogs REST API with personal access token
- localStorage for settings, preferences, and collection cache
- Service worker for offline app shell

## API usage

RunOut uses the [Discogs API](https://www.discogs.com/developers) with a personal access token. It calls:

- `GET /database/search` — search releases
- `GET /users/{username}/collection/folders/0/releases` — load collection
- `GET /users/{username}/collection/folders` — list folders
- `GET /users/{username}/collection/fields` — list custom fields
- `POST /users/{username}/collection/folders/{id}/releases/{id}` — add release
- `POST .../instances/{id}/fields/{id}` — set condition/notes

Rate limiting is respected with a 350ms delay between paginated collection requests.

## License

[MIT](LICENSE)

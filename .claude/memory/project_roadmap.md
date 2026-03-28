---
name: Project roadmap
description: Planned features for RunOut — release images, details view, barcode scanning, cache versioning
type: project
---

Planned improvements as of 2026-03-28:
1. Release images (center labels) — to help identify correct pressing
2. Release details (runout text, notes) — more info per release
3. Barcode scanning via camera — mobile UX improvement
4. Bump sw.js cache version on updates — currently hardcoded as `runout-v1`

**Why:** The app is functional for basic search+add workflow, these features improve identification accuracy and mobile usability.
**How to apply:** When implementing features, maintain the single-file architecture and CDN-only approach. No build step.

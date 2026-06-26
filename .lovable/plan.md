## Goal
Export the current Home page (`/`) as a single self-contained HTML file that the user can download.

## Approach
1. Render the running app's Home page via headless Chromium (Playwright) at the mobile viewport (430px wide, matching the app shell).
2. Capture the fully rendered DOM after hydration.
3. Inline all external resources:
   - Inline computed CSS (collect all stylesheets and embed into a single `<style>` block).
   - Inline fonts/images as base64 data URIs.
   - Strip `<script>` tags (static export — no React runtime needed).
4. Wrap into a single standalone `.html` file.
5. Save to `/mnt/documents/home.html` and deliver via `<presentation-artifact>`.

## Notes
- Output is a static visual snapshot of the current Home state (update bar, my crops chips, today's hero card, 오늘 급변 작물 list). Interactions (bottom sheets, navigation) will not function — this is by design for a single-file export.
- Korean text and emojis preserved with UTF-8.
- Bottom nav rendered but non-functional.

## Deliverable
`/mnt/documents/home.html` — one self-contained file, openable in any browser.

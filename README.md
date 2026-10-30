# art.ivolopes.com

[![CI](https://github.com/githubdoivo/art.ivolopes.com/actions/workflows/ci.yml/badge.svg)](https://github.com/githubdoivo/art.ivolopes.com/actions/workflows/ci.yml)

Ceramics by Ivo Lopes, as an artist's sketchbook on washi paper: a
watercolour of the gourd on a table, the making told as a scroll story (five
drawings pressed onto the wall like notes), the real pieces taped in on torn
paper, a watercolour of Porto, and the order button. No menu: only PT/EN.

- **`index.html`, `book.css`, `book.js`**: the home page. All text is real
  text, from `content.js` (`book`, English and Portuguese).
- **`book/`**: the images. Step drawings, tape strips, the header painting
  (`header.webp`, `header-900.webp` for phones, edges faded into the page)
  and the Porto watercolour come from ChatGPT (prompts in
  `~/Downloads/art-refs/PROMPTS-v3.md`). `paper-tile.webp` is a seamless
  560px paper tile cut from `paper.webp`, so the page shows no seams.
  `work-*.webp` are real pieces cut out of their photos and set on torn
  paper (no shadows): to add one, make a 720x900 card the same way and add it
  to `pieces` in `content.js` (both languages, with a describing `alt`).
- **`/order/`**: the order form as a page of the sketchbook (`order-page.js`, `order.js`, `order.css`).
- **`worker/`**: the Cloudflare Worker behind the form (orders.ivolopes.com): Turnstile check, D1 + R2 storage, and an email to the inbox with Reply-To set to the customer. Deployed with Wrangler, separately from the site.
- `assets/src/` holds source images on this Mac only (untracked, not part of the site).

`npm test` runs the Playwright tests (both languages, every image loads,
photo descriptions, phone width, accessibility, the order form). CI runs them, plus a Lighthouse audit, on every push and daily.
`npm run og` re-renders the link preview image: run it after a visible change to the home page, and bump the `?v=` on `og:image` in `index.html` so chat apps fetch the new one instead of a cached copy.

# art.ivolopes.com

[![CI](https://github.com/githubdoivo/art/actions/workflows/ci.yml/badge.svg)](https://github.com/githubdoivo/art/actions/workflows/ci.yml)

Ceramics by Ivo Lopes. As you scroll, a 3D lump of clay is wedged, centred on
the wheel, opened, pulled, shaped into a jar, bisque-fired and glazed, with
each step of the page's text alongside it.

- **`clay.js`**: the piece. A profile curve (radius against height) spun
  around the axis like a wheel-thrown pot, with one profile per stage,
  resampled to the same points so stages blend smoothly. Surface roughness,
  throwing rings, colour and finish (wet clay → bone dry → bisque → glaze,
  with a bare foot ring) follow the stage too. three.js, no build step.
- **`content.js`**: all the text, in English and Portuguese. The three
  pieces under "Work" are placeholders: add photos to `images/` and set
  `photo` on each.
- **`app.js`**: turns the scroll position into the clay's stage, plus the
  language and theme switches.
- Phones: the clay sits in the top half and each section's text arrives in a
  card below it. Browsers without WebGL get a still drawing of the finished jar.

`npm test` runs the Playwright tests (both languages, scroll-to-stage, the
kiln glow, the phone layout never covering the clay, the no-WebGL fallback,
accessibility). CI runs them, plus a Lighthouse audit, on every push and daily.
`npm run og` re-renders the link preview image.

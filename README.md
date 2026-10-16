# Ranveer Singh — Silicon 3D Model

Interactive, single-page Honors Chemistry project showing the three naturally stable silicon isotopes. Built with React, TypeScript, Vite, Three.js, React Three Fiber, Drei, Tailwind CSS, Motion and GSAP. No backend, API keys or paid services are required.

## Run locally

Requires Node.js 22.12+ and npm.

```sh
npm ci
npm run dev
npm run build
npm test
npm run preview
```

## Science

| Isotope | Protons | Neutrons | Electrons | Electron shells |
| --- | --- | --- | --- | --- |
| Silicon-28 | 14 | 14 | 14 | 2 / 8 / 4 |
| Silicon-29 | 14 | 15 | 14 | 2 / 8 / 4 |
| Silicon-30 | 14 | 16 | 14 | 2 / 8 / 4 |

Simplified Bohr model — electron paths are illustrative. The nucleus uses deterministic compact sphere packing; orbital paths and particle sizes are illustrative, not to scale. Stable isotope reference: https://physics.nist.gov/cgi-bin/Compositions/stand_alone.pl?ele=Si

## Explore

Select an isotope, drag to orbit, scroll or pinch to zoom, and click a particle to identify and focus it. Reset view restores the camera and clears selection. Keyboard users can focus the viewport and use arrow keys, +/- and Escape; buttons provide zoom, reset and particle-type selection. Reduced-motion preferences are respected. WebGL failure shows a clear fallback.

## Verification and performance

`npm test` validates all isotope counts, shell populations, particle IDs, coordinates and stable nucleus positions. `npm run build` includes TypeScript checking. `tests/browser-check.js` is a Playwright CLI run-code function; navigate Chrome to the target URL, then run it with `playwright-cli -s=<session> run-code --filename tests/browser-check.js`.

The Chrome suite covers isotope counts, transitions, pointer picking, camera controls, keyboard access, responsive sizes, reduced motion, emulated touch, initial loading and WebGL failure. Touch testing is emulated; physical phone/Chromebook performance has not been measured.

The scene uses shared geometry/materials, demand rendering, capped DPR 1.5 and fewer than 39,000 triangles. The lazily loaded Three.js scene is about 287 KB gzipped; Vite reports a large-chunk advisory. See TEST-RESULTS.md for actual validation results.

## Deployment

Vercel uses the Vite framework, `npm run build`, and `dist` output, configured in vercel.json. No environment variables are needed. Never commit tokens, local CLI authentication, node_modules or .vercel files.

Live website: https://silicon-3d-model.vercel.app
Source: https://github.com/dudecrystal/silicon-3d-model

### Refined inspection and Blender-style controls
Zoom in, then hold the pointer over a particle for 600ms to reveal its name without selecting it. Leaving or moving the camera dismisses the label. Middle-drag or left-drag orbits; Shift + middle-drag or right-drag pans; Ctrl + middle-drag or the wheel zooms. Reset view recenters after panning. Click and keyboard particle selection remain available on touch and without hover. Additional Chrome run-code checks: tests/hover-check.js and tests/blender-controls-check.js.


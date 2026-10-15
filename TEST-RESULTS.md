# Verification — October 15, 2026

- TypeScript + Vite production build: passed.
- Atomic data tests: passed; correct counts, shell populations, IDs, coordinates and stable packing.
- Google Chrome browser suite: 42/42 passed on final local source.
- Includes actual sphere picking for all three particle types, orbit/wheel zoom, focus/reset, rapid isotope switching, sliding indicator and fades, keyboard/focus, responsive 320/390/768/1024 widths, reduced motion, touch-emulated drag/pinch, loading and WebGL fallback.
- Additional mobile annotation-band check: no overlap; annotation bottom and canvas top both 330.78px at 390px width. Independent rendered review: ship.
- Scene triangles: Si-28 24,144; Si-29 24,664; Si-30 25,184.
- App dependencies: zero advisories in installed dependency audit.
- Limitations: physical Chromebook/phone performance unmeasured; touch emulated. Vite reports large lazy Three.js chunk (~283KB gzip). Three.js emits an upstream Clock deprecation warning.

Production verification is recorded after deployment.

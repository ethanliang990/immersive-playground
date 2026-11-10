# Immersive Playground

An original browser-based experiment for learning interactive visual design with plain HTML, CSS, and JavaScript. It is intentionally dependency-free so the code stays easy to inspect and modify.

## Try it

- Move or drag your pointer across the page to steer the field.
- Click/tap to send a ripple outward.
- Switch between **Drift**, **Pulse**, and **Lattice** modes.
- Change **Energy** and **Particles**, or press **R** to remix the field.
- Keyboard: `1`, `2`, `3` select modes; `Space` pauses; `R` remixes.

## Files to explore

```text
index.html             page structure and controls
assets/css/styles.css  visual design and responsive layout
assets/js/main.js      canvas physics, controls, and interactions
```

## Make it yours

Start with `assets/js/main.js`:

1. Change the three RGB arrays in `palette`.
2. Adjust the mode behaviours inside `updateParticle`.
3. Add a fourth mode button in `index.html`, then define its behaviour in JavaScript.
4. Try changing the `maxDistance` value in `drawConnections`.

This project is an original implementation inspired by the general idea of experimental immersive portfolio pages. It does not reuse code, assets, or copy from other sites.

// The oscillation: three neutrinos sweep past us through a field of stars, fall together and
// trade flavors three times, and freeze as the mark beside its name. Pure functions and no DOM,
// like web/cal.js: frame(t) returns plain vector shapes, and a canvas, an SVG file or a video only
// draws them, so all three stay the same film at any size.
//
// It's a real scene, seen through a real lens. X is right, Y up, Z away from us, and the neutrinos
// fly along (1, 1, 1). The camera ends looking straight down at the plane they fly in, turned so
// that line runs up and to the right, which is why the last frame is the logo and nothing has to
// morph into it: the tails are fixed lengths along each bead's own path, and it all simply stops.
//
// Two layers, as in the physics. The mass is the beads: one outline that merges and pinches. The
// flavors are three colour fields inside it, each point taking the colour of the nearest flavor.
// A bead never changes colour; the field turns inside it.
//
// The film itself is all vector. surface() is the lens and the tube it's then seen through: real
// motion blur, and the '80s grade of bloom, scanlines and grain.
globalThis.NeutrinoMotion = (() => {
  'use strict';

  const { PI, cos, sin, hypot, atan2, min, max, abs, exp, sqrt, ceil, floor, round } = Math;
  const TAU = PI * 2;

  // ── The scene ──────────────────────────────────────────────────────────
  // Everything worth changing is here. Lengths are units of the icon's 135-unit grid
  // (mac/icon.swift) and times are seconds.
  const SCENE = {
    heading: 45,        // the way they point at the end, degrees anticlockwise from east
    duration: 9.2,      // the logo is settled by 5.2, so this holds it for 4 seconds
    view: 300,          // how much of the scene the height of the frame shows, in the grid's units
    wide: 480,          // and the width, at the least. More shows more of the scene: the finish stays in pixels
    fps: 60,

    speed: 1900,        // how fast they fly through the stars, units a second
    lens: 220,          // the camera's focal length, in the same units as view

    flight: 5.7,        // a bead's radius in flight
    circle: 42,         // they fly as a triangle, each this far from the middle
    orbit: 2.4,         // and orbit each other as they go, radians a second, like three stars
    tilt: .72,          // the plane of that orbit leans towards the camera, so near beads are nearer
    cohesion: 5,        // how far apart two beads start reaching for each other
    // As they part the liquid draws out into a fine straight thread between them, thinning as it
    // stretches until it breaks and each end recoils into its bead. connected is how long a pair
    // stays joined in all, from first touch to the break. Widths are half widths.
    thread: { connected: .26, recoil: .09, base: .62, thin: .34 },
    wobble: { rate: 20, damping: .45 },   // the beads ring like water, this fast and for this long

    // Each flavor meets the other two once, and that's all the changing they do. A touch is a
    // long pendulum: two beads at the ends of its swing, almost still, fall towards each other
    // faster and faster, pass through the middle at full speed, and rise out the far side, each
    // taking the other's corner of the triangle. So the colours end up changed places, and three
    // swings leave the beads in the order the mark needs. t is when a swing starts, swing how long it takes end to end.
    touches: [
      { t: .35, swing: 1.3, a: 0, b: 1 },
      { t: 1.02, swing: 1.1, a: 1, b: 2 },
      { t: 1.72, swing: .9, a: 2, b: 0 },
    ],
    twist: 1.4,         // how far the fluid at the middle gets ahead of the fluid at the edge

    // The camera is keyed by the picture it gets: where the middle of the three sits on the frame,
    // and how big they look. Where it has to be to get that picture is worked out. It starts with
    // them just behind it, so they come past over its shoulder, bottom left; it catches up and
    // follows them away; then it rushes up, overshoots, and swings back down onto them. null is
    // the mark's own place in the lockup.
    picture: [
      [0, -440, 300, 7.4], [.1, -258, 176, 5], [.22, -170, 116, 3.6], [.4, -112, 62, 2.4], [.6, -70, 24, 1.7], [.9, -44, 8, 1.36],
      [1.5, -20, 4, 1.28], [2.4, -4, -6, 1.22], [2.66, 8, -12, 1.2], [2.86, 22, -6, 1.14],
      [3.08, 12, 46, 1.02], [3.3, -34, 42, .94], [3.5, -84, 10, .88], [3.75, null, 0, null],
    ],
    turn: [2.62, 3.55], // it comes round from following them to looking straight down on them
    // Speed wobble: at this pace the camera can't quite hold steady. It rattles on its mount, which
    // throws the whole picture about, stars and all. size is how far, in units, on top of a little
    // roll in radians, rate how many times a second, over how hard it is across the film. It has
    // to be gone before they land, because the last frame is the logo.
    shake: { size: 6.9, roll: .015, rate: 7.3, over: [[0, 1.1], [.14, 1.69], [.34, 1.6], [.56, .7], [.8, .455], [2.5, .455], [2.9, .54], [3.2, .365], [3.46, 0]] },

    form: [2.72, 3.41],  // they settle onto their lines
    flat: [3.14, 3.66],  // glowing in flight, flat when they land
    brake: [3.5, 4],   // the world's clock runs down to nothing: the freeze frame

    ring: 3.67,         // the planet rings out as they stop inside it
    // A tail is one thing from start to finish: a long, faint ribbon of light along the path its
    // bead has really taken among the three, swings and orbit included, drifting back behind them
    // far slower than they fly, like a long exposure of the family. As the world brakes it catches
    // up with its neutrino and condenses into the mark's three dashes.
    comet: {
      reach: [[0, 620], [3.23, 620], [3.45, 300], [3.61, 130], [3.75, 86]],   // how far back it goes, over the film
      drift: 300,           // how fast it falls behind them, units a second
      width: 1.25,          // half its width
      light: .3,            // how bright it is at its brightest
      home: [3.33, 3.71],   // when it settles into the mark's dashes
      steps: 14,            // how many points along each piece of it
    },
    stars: { shutter: .065, longest: 145, fade: [3.85, 4.65], rest: .35, field: 930, size: 900, sky: 595, deep: 6000, still: 1500, shake: .85, glow: '#5f9dff', halo: 2.4, light: .62 },   // shake is how much of the camera's rattle they feel; glow is the colour of their halo, halo how wide it's drawn, light how bright

    // Long soft strokes of blue that go by off to the side, like nebulae. They only exist in the
    // tube. strokes is how many along the flight, each of strands soft lines, length, away and width
    // in units, puff how thick each stamp of it is, light how bright, rest how bright behind the logo,
    // pace how many times faster than the stars they go by, tint their colour.
    nebula: { strokes: 28, length: [1800, 4200], away: [200, 900], width: [140, 380], strands: 3, puff: .075, light: .416, rest: .4, pace: 1.5, tint: [.05, .25, .62] },

    blur: { shutter: 1 / 110, live: 4, film: 16 },   // how long the shutter stays open, and how many moments it sees
    grade: { lines: 380, glow: .364, halo: .299 },   // the tube
    // The finish, in this order, as After Effects would have it, with sizes at 1080p. blur is a true
    // Gaussian sigma: After Effects' Blurriness is about 2.3 times that. sharpen is an unsharp mask
    // of it, 2 for 200%. The glow is a deep one, a stack of ever wider blurs that falls off like inverse
    // square. aberration moves red out and blue in, as a share of the way from the middle, and edge
    // is how much more of that gathers towards the corners of the glass. Grain is
    // Noise HLS Auto's: lightness, size and speed.
    post: {
      damage: { opacity: .4, rate: 18, frames: 18, specks: 7 },
      blur: 1.625,
      sharpen: 2,
      glow: { radius: 162.5, exposure: .26 },
      aberration: .000975,
      edge: .65,
      grain: { lightness: .05, size: 2, speed: 12 },
    },
    // The tube wakes up for the landing. Scanlines all but go in flight and return in time for the
    // name. As the mark completes a crest of bloom and fringing rises on it and runs along the name
    // with the letters; once they've landed everything flares together, then settles just above
    // where it began. All of it is 0 to 1 on the way to the flare's peak, where bloom is that many
    // times stronger, and fringe is how far the colours part, as a share of the frame's width.
    tube: {
      quiet: .08, full: .55, back: [3.5, 3.87],         // how much scanline in flight and for the name, and when it returns
      bloom: 2.6, fringe: .00195, rest: .14,              // the peak, and where it settles
      crest: { rise: [3.72, 3.87], fall: [4.32, 4.56], height: .72, width: 34, trail: 130 },
      flare: [4.24, 4.5, 4.58, 5.2],                    // up from, up by, down from, down by
      alone: [3.72, 3.84, 3.86, 4.1],                   // the same, with no name to wait for
      merge: { rise: .1, fade: .34, height: .9, size: 40, wide: 11, spread: 2, streak: [.2, .003, .95] },   // the same light where two drops meet, which are small: how long it comes and goes, how high, how far across, how much more halo and fringing, and a blue anamorphic streak: how far it reaches and how thin, as shares of the frame, and how bright
    },

    lockup: { mark: .84, x: 25.2, gap: 18, at: 3.87, stagger: .052, pace: 1.43 },
  };

  // The mark, from mac/icon.swift. Flavors in the icon's order: mint, yellow, red, which is also
  // Calendar, Notes, Tasks and, as it happens, ν-e, ν-μ, ν-τ: events, memos, tasks.
  const MARK = {
    ring: 33, ringWidth: 5.5, head: 7.5, tailWidth: 7,
    streaks: [{ n: 19, s: 34.5 }, { n: 0, s: 52.5 }, { n: -19, s: 42.5 }],
    tail: [{ from: 12, to: 50, alpha: 1 }, { from: 60, to: 72, alpha: .65 }, { from: 80, to: 86, alpha: .4 }],
  };

  // The name, in Changa SemiBold by Eduardo Tunni (SIL Open Font License), as outlines on an
  // x-height of 30 with the font's own spacing, so nothing needs the font installed.
  const GLYPHS = [
    { d: 'M4.52 0V-37.5H13.31L24.72 -19.13Q25.59 -17.72 25.9 -16.88Q26.22 -16.04 26.25 -15.14H26.61V-37.5H35.55V0H26.76L15.35 -18.37Q14.51 -19.81 14.2 -20.65Q13.89 -21.49 13.82 -22.36H13.46V0Z', width: 40.08 },
    { d: 'M16.45 0.75Q12.7 0.75 10.07 -0.09Q7.44 -0.93 5.82 -2.77Q4.21 -4.61 3.46 -7.63Q2.72 -10.64 2.72 -15Q2.72 -20.73 4.14 -24.2Q5.56 -27.66 8.7 -29.2Q11.84 -30.75 16.97 -30.75Q22.03 -30.75 24.86 -29.89Q27.69 -29.04 28.84 -26.96Q29.99 -24.88 29.99 -21.16Q29.99 -18.24 29.22 -16.35Q28.44 -14.46 26.49 -13.39Q24.54 -12.31 21.09 -11.88Q17.64 -11.44 12.25 -11.44H10.45V-16.37H17.35Q20 -16.37 20.97 -17Q21.95 -17.64 21.95 -19.38V-23.97H16.82Q14.2 -23.97 13.23 -23.37Q12.25 -22.77 12.25 -21.08V-6.42Q13.28 -6.17 14.53 -6.07Q15.78 -5.96 17.58 -5.96Q20.07 -5.96 22.57 -6.32Q25.08 -6.68 28.11 -7.46L29.21 -1.17Q26.55 -0.24 23.25 0.25Q19.95 0.75 16.45 0.75Z', width: 33.3 },
    { d: 'M30.89 -30V0H26.55L24.25 -3Q21.76 -1.11 18.81 -0.18Q15.86 0.75 12.37 0.75Q8 0.75 5.96 -1.05Q3.92 -2.84 3.92 -6.73V-30H12.86V-5.58H18.21Q20.35 -5.58 21.15 -6.14Q21.95 -6.69 21.95 -8.18V-30Z', width: 35.1 },
    { d: 'M11.79 0.75Q8.71 0.75 7.22 -0.6Q5.73 -1.94 5.73 -4.75V-35.63L14.67 -37.86V-6.47Q15.6 -6.35 16.51 -6.26Q17.43 -6.17 18.58 -6.11L18.13 -0.06Q16.18 0.36 14.61 0.55Q13.04 0.75 11.79 0.75ZM2.12 -24.1V-30H19.42V-24.1Z', width: 21.54 },
    { d: 'M8.6 -30 11.29 -25.64Q13.52 -27.81 15.59 -29.05Q17.65 -30.3 19.83 -30.9L20.49 -22.2Q19.41 -21.98 17.98 -21.46Q16.56 -20.93 15.28 -20.31Q14.01 -19.7 13.16 -19.06V0H4.22V-30Z', width: 21.12 },
    { d: 'M4.22 -29.05 13.16 -30.24V0H4.22Z', width: 17.4 },
    { d: 'M4.22 0V-30H8.57L10.87 -27Q13.32 -28.89 16.19 -29.82Q19.05 -30.75 22.44 -30.75Q26.67 -30.75 28.93 -29.19Q31.19 -27.64 31.19 -24.77V0H22.25V-23.39H16.91Q14.79 -23.39 13.98 -22.83Q13.16 -22.27 13.16 -20.79V0Z', width: 35.1 },
    { d: 'M17.15 0.75Q13.16 0.75 10.39 -0.08Q7.62 -0.9 5.93 -2.73Q4.24 -4.55 3.48 -7.58Q2.72 -10.61 2.72 -15Q2.72 -19.42 3.48 -22.45Q4.24 -25.48 5.93 -27.3Q7.62 -29.13 10.39 -29.94Q13.16 -30.75 17.15 -30.75Q21.2 -30.75 23.97 -29.94Q26.74 -29.13 28.41 -27.3Q30.09 -25.48 30.83 -22.46Q31.58 -19.45 31.58 -15Q31.58 -10.61 30.83 -7.58Q30.09 -4.55 28.4 -2.73Q26.71 -0.9 23.94 -0.08Q21.17 0.75 17.15 0.75ZM12.22 -6.17H19.46Q21.03 -6.17 21.55 -6.5Q22.08 -6.83 22.08 -7.76V-23.83H14.84Q13.33 -23.83 12.78 -23.5Q12.22 -23.17 12.22 -22.24Z', width: 34.32 },
  ];
  const DOT = { glyph: 5, d: 'M8.72 -33.9Q5.8 -33.9 4.76 -34.92Q3.71 -35.95 3.71 -38.82Q3.71 -41.75 4.77 -42.81Q5.83 -43.86 8.73 -43.86Q11.56 -43.86 12.6 -42.8Q13.65 -41.74 13.65 -38.81Q13.65 -35.96 12.65 -34.93Q11.65 -33.9 8.72 -33.9Z' };

  const THEMES = {
    space: { bg: '#000000', ring: '#e8e9ed', star: '#dbe7ff', flavors: ['#72ccb6', '#e8b33f', '#e26a4c'] },
    dark: { bg: '#16171b', ring: '#e8e9ed', star: '#dbe7ff', flavors: ['#72ccb6', '#e8b33f', '#e26a4c'] },
    light: { bg: '#ffffff', ring: '#17191d', star: '#17191d', flavors: ['#5dbfa7', '#e3a92b', '#dd5f40'] },
  };

  // ── Curves ─────────────────────────────────────────────────────────────
  const clamp = (x, a = 0, b = 1) => min(b, max(a, x));
  const mix = (a, b, u) => a + (b - a) * u;
  const smooth = (a, b, x) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };

  // A damped spring let go at time 0: rises, overshoots a little, settles on 1.
  const spring = (t, rate, damping) => {
    if (t <= 0) return 0;
    const w = rate * sqrt(1 - damping * damping), d = damping * rate;
    return 1 - exp(-d * t) * (cos(w * t) + d / w * sin(w * t));
  };

  // A smooth curve through [time, value] keys, level past the last one.
  const curve = (keys) => {
    const n = keys.length;
    const slope = (i) => {
      const a = keys[max(i - 1, 0)], b = keys[min(i + 1, n - 1)];
      return i === n - 1 ? 0 : (b[1] - a[1]) / (b[0] - a[0]);
    };
    return (t) => {
      if (t <= keys[0][0]) return keys[0][1] + slope(0) * (t - keys[0][0]);
      if (t >= keys[n - 1][0]) return keys[n - 1][1];
      let i = 0;
      while (t > keys[i + 1][0]) i++;
      const [t0, v0] = keys[i], [t1, v1] = keys[i + 1], h = t1 - t0, u = (t - t0) / h;
      const u2 = u * u, u3 = u2 * u;
      return (2 * u3 - 3 * u2 + 1) * v0 + (u3 - 2 * u2 + u) * slope(i) * h
        + (3 * u2 - 2 * u3) * v1 + (u3 - u2) * slope(i + 1) * h;
    };
  };

  // ── Directions ─────────────────────────────────────────────────────────
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const unit = (a) => { const l = hypot(a[0], a[1], a[2]); return [a[0] / l, a[1] / l, a[2] / l]; };
  const blend = (a, b, u) => [mix(a[0], b[0], u), mix(a[1], b[1], u), mix(a[2], b[2], u)];
  const toward = (a, b, c, x, y, z) => [a[0] * x + b[0] * y + c[0] * z, a[1] * x + b[1] * y + c[1] * z, a[2] * x + b[2] * y + c[2] * z];

  const ALONG = unit([1, 1, 1]);        // the way they fly
  const DOWN = unit([1, -2, 1]);        // the way the camera looks at the end, square to their flight
  const RIGHT = cross(ALONG, DOWN);     // to the right of their flight, seen from there
  const UP = [0, 1, 0];

  // ── The world's clock ──────────────────────────────────────────────────
  // Runs with the film, then brakes to nothing. Beads, camera and stars all live on this clock, so
  // when it stops they stop together. What happens after that runs on the film's own time.
  const T = SCENE.duration;
  const [B0, B1] = SCENE.brake, STOP = B0 + (B1 - B0) / 2;
  const clock = (t) => { if (t <= B0) return t; const u = min(1, (t - B0) / (B1 - B0)); return B0 + (B1 - B0) * (u - u * u / 2); };
  const rate = (t) => (t <= B0 ? 1 : 1 - min(1, (t - B0) / (B1 - B0)));

  // ── Where the beads are ────────────────────────────────────────────────
  // A long pendulum: hanging almost still at either end, whipping through the middle.
  const swinging = (u) => { const x = clamp(u), e = x * x * x * (x * (6 * x - 15) + 10); return e * e * (3 - 2 * e); };

  // Bead j starts in corner j of the triangle. A swing sends two beads to each other's corners
  // along the side between them, straight through each other at its middle. They can overlap in
  // time, since a swing hardly moves near its ends: the next one is already gathering.
  const ORBIT_ENDS = SCENE.form[0] + .1, ORBIT_EASES = .6;
  const orbited = (w) => {   // how far they've turned, easing out as they settle onto their lines
    const x = clamp((w - ORBIT_ENDS) / ORBIT_EASES), run = min(w, ORBIT_ENDS) + ORBIT_EASES * (x - x * x * x + x * x * x * x / 2);
    return run - ORBIT_ENDS - ORBIT_EASES / 2;
  };
  const corner = (p, w) => {
    const a = .52 + SCENE.orbit * orbited(w) + p * TAU / 3;
    return [SCENE.circle * cos(a), SCENE.circle * sin(a)];
  };
  const inFlight = (j, w) => {
    const seats = [0, 1, 2];
    let [x, y] = corner(j, w);
    for (const k of SCENE.touches) {
      const by = swinging((w - k.t) / k.swing), p = seats[k.a], q = seats[k.b];
      if (by && (k.a === j || k.b === j)) {
        const from = corner(p, w), to = corner(q, w), way = k.a === j ? by : -by;
        x += (to[0] - from[0]) * way; y += (to[1] - from[1]) * way;
      }
      seats[k.a] = q; seats[k.b] = p;
    }
    return [x, y];
  };

  // How far apart a touching pair is, and how much they're one drop at the moment.
  const apart = (k, w) => { const a = inFlight(k.a, w), b = inFlight(k.b, w); return hypot(a[0] - b[0], a[1] - b[1]); };
  const midOf = (k) => k.t + k.swing / 2;
  const merging = (k, w) => (abs(w - midOf(k)) > .3 ? 0 : clamp(1 - apart(k, w) / (SCENE.flight * 2.3)));
  // A pair first touches a little before the middle of its swing, so the thread lasts whatever is
  // left of the time they stay connected. Found once, by walking back from the middle.
  const SNAPS = SCENE.touches.map((k) => {
    const touching = SCENE.flight * 2.2 + SCENE.cohesion / 2;
    let u = 0;
    while (u < .4 && apart(k, midOf(k) - u) < touching) u += .001;
    return SCENE.thread.connected - u;
  });
  // The thread between a parting pair: how far stretched, and how far its broken ends have recoiled.
  const threadOf = (k, w) => {
    const u = w - midOf(k), snap = SNAPS[SCENE.touches.indexOf(k)];
    if (u < .02 || u > snap + SCENE.thread.recoil) return null;
    return { stretch: clamp(u / snap), recoiled: clamp((u - snap) / SCENE.thread.recoil) };
  };

  // A bead's place in the formation: along the flight, to its right, and towards the camera's plane.
  const lifted = (x, y) => [y * sin(SCENE.tilt), x, y * cos(SCENE.tilt)];
  const place = (j, w) => {
    const [x, y] = inFlight(j, w), end = MARK.streaks[j], u = smooth(...SCENE.form, w), [a, b, c] = lifted(x, y);
    return [mix(a, end.s, u), mix(b, end.n, u), c * (1 - u)];
  };
  const middle = (w) => { const s = SCENE.speed * (w - STOP); return [ALONG[0] * s, ALONG[1] * s, ALONG[2] * s]; };
  const inWorld = (w, p) => { const m = middle(w), o = toward(ALONG, RIGHT, DOWN, p[0], p[1], p[2]); return [m[0] + o[0], m[1] + o[1], m[2] + o[2]]; };
  const bead = (j, w) => inWorld(w, place(j, w));
  const wake = (j, w, d) => {
    const when = d / SCENE.comet.drift, p = place(j, w - when);
    return inWorld(w, [p[0] - d, p[1], p[2]]);
  };
  // Two beads in one space are one bigger drop, or they'd seem to lose half their water.
  const radius = (w, j) => {
    const swell = j === undefined ? 0 : max(0, ...SCENE.touches.filter((k) => k.a === j || k.b === j).map((k) => merging(k, w)));
    return mix(SCENE.flight * (1 + .34 * swell), MARK.head, smooth(...SCENE.form, w));
  };

  // ── The camera ─────────────────────────────────────────────────────────
  const WIDTH = GLYPHS.reduce((sum, g) => sum + g.width, 0);

  // The last frame's framing: how the camera is turned, and where the mark and the name sit.
  const rigs = new Map();
  const rig = (o = {}) => {
    const degrees = o.heading ?? SCENE.heading, word = o.wordmark !== false, key = `${degrees}/${word}`;
    if (rigs.has(key)) return rigs.get(key);
    const h = degrees * PI / 180, c = cos(h), z = sin(h), { mark, x, gap } = SCENE.lockup;
    const across = (st, s, r) => [s * c + st.n * z - r, s * c + st.n * z + r];
    const reachOf = MARK.streaks.flatMap((st) => [...across(st, st.s, MARK.head), ...across(st, st.s - 86, MARK.tailWidth / 2)]);
    const left = min(-MARK.ring - 2.75, ...reachOf) * mark, right = max(MARK.ring + 2.75, ...reachOf) * mark;
    const size = x / 30, total = right - left + gap + WIDTH * size, shift = word ? -total / 2 - left : 0;
    const key3 = (i, last) => curve(SCENE.picture.map((p) => [p[0], p[i] === null ? last : p[i]]));
    const { at, stagger } = SCENE.lockup, words = shift + right + gap, ends = GLYPHS.length - 1;
    const end = {
      r: ALONG.map((v, i) => v * c + RIGHT[i] * z), u: ALONG.map((v, i) => v * z - RIGHT[i] * c), shift, word: words, size,
      pictureX: key3(1, shift), pictureY: key3(2, 0), pictureSize: key3(3, mark),
      crest: !word ? () => shift : curve([   // on the mark, then with each letter as it lands
        [SCENE.tube.crest.rise[0], shift], [at + .05, words + GLYPHS[0].width * size / 2], [at + stagger * ends + .1, words + (WIDTH - GLYPHS[ends].width / 2) * size],
      ]),
    };
    rigs.set(key, end);
    return end;
  };

  const LINE = unit([.37, .37, .85]);   // the way it looks while they sweep past

  // The camera's rattle, as a look aside, a look up and a roll. Three rates that never line up, in
  // swells, so it doesn't settle into a rhythm.
  const shakes = curve(SCENE.shake.over);
  const shaken = (w) => {
    const { size, roll, rate } = SCENE.shake, swell = shakes(w) * (.72 + .28 * sin(TAU * 1.1 * w + 2));
    const rattle = (s) => swell * (sin(TAU * rate * w + s) + .6 * sin(TAU * rate * 1.63 * w + s * 2.1) + .8 * sin(TAU * rate * .41 * w + s * 3.7)) / 2.4;
    return [size / SCENE.lens * rattle(0), .7 * size / SCENE.lens * rattle(1.7), roll * rattle(4)];
  };

  // Rattling turns the camera where it stands, so all of the picture moves together: that's what
  // says it's the camera and not the beads. shake is how much of it to take: stars take a little
  // less, so the beads stay what's rattling most, and the beads' own stretch takes none.
  const pose = (w, r, shake = 1) => {
    const m = middle(w), turned = smooth(...SCENE.turn, w), lens = SCENE.lens;
    const f = unit(blend(LINE, DOWN, turned)), right = unit(cross(unit(blend(UP, r.u, turned)), f)), up = cross(f, right);
    const z = lens / r.pictureSize(w), x = r.pictureX(w) * z / lens, y = -r.pictureY(w) * z / lens;
    const at = [0, 1, 2].map((i) => m[i] - x * right[i] - y * up[i] - z * f[i]);
    if (!shake || !shakes(w)) return { at, f, r: right, u: up };
    const [yaw, pitch, roll] = shaken(w).map((v) => v * shake), look = unit(toward(right, up, f, yaw, pitch, 1));
    const across = unit(cross(toward(right, up, f, sin(roll), cos(roll), 0), look));
    return { at, f: look, r: across, u: cross(look, across) };
  };

  // Where a point lands on the frame, and how much bigger or smaller things are there.
  const project = (cam, p) => {
    const dx = p[0] - cam.at[0], dy = p[1] - cam.at[1], dz = p[2] - cam.at[2];
    const z = dx * cam.f[0] + dy * cam.f[1] + dz * cam.f[2];
    const scale = SCENE.lens / max(z, .5);
    return { x: (dx * cam.r[0] + dy * cam.r[1] + dz * cam.r[2]) * scale, y: -(dx * cam.u[0] + dy * cam.u[1] + dz * cam.u[2]) * scale, scale, z };
  };

  // ── The tails and the wobble ───────────────────────────────────────────
  // A bead is a drop of water: fast ones stretch, touching ones lean in, and all of them ring
  // afterwards. The stretch is a pair of numbers, its size and direction doubled, on a spring.
  const STEP = 1 / 240, count = ceil(T / STEP) + 2;
  const slot = (t) => clamp(t / STEP, 0, count - 1.001);
  const plain = rig();
  const shapes = [0, 1, 2].map((j) => {
    const q = new Float64Array(count * 2);
    let a = 0, b = 0, va = 0, vb = 0;
    const { rate: spin, damping } = SCENE.wobble;
    for (let i = 1; i < count; i++) {
      const t = i * STEP, w = clock(t), was = clock(t - STEP), cam = pose(w, plain, 0), old = pose(was, plain, 0);
      const p = project(cam, bead(j, w)), o = project(old, bead(j, was));
      const ds = (p.x - o.x) / STEP, dn = (p.y - o.y) / STEP, seen = p.z > 8 && o.z > 8;
      const e = seen ? min(.2, hypot(ds, dn) / 2000) : 0, dir = atan2(dn, ds) * 2;
      let ta = e * cos(dir), tb = e * sin(dir);
      for (const k of SCENE.touches) {
        if (k.a !== j && k.b !== j) continue;
        const held = threadOf(k, w), close = max(merging(k, w), held && !held.recoiled ? .55 : 0);
        if (!close) continue;
        const f = project(cam, bead(k.a === j ? k.b : k.a, w)), ax = atan2(f.y - p.y, f.x - p.x) * 2;
        ta += .24 * close * cos(ax); tb += .24 * close * sin(ax);
      }
      va += (-spin * spin * (a - ta) - 2 * damping * spin * va) * STEP;
      vb += (-spin * spin * (b - tb) - 2 * damping * spin * vb) * STEP;
      a += va * STEP; b += vb * STEP;
      q[i * 2] = a; q[i * 2 + 1] = b;
    }
    return q;
  });

  const stretch = (j, t) => {
    const u = slot(t), i = floor(u), f = u - i, q = shapes[j];
    const hush = 1 - smooth(B0, B1 - .05, t);
    return [mix(q[i * 2], q[i * 2 + 2], f) * hush, mix(q[i * 2 + 1], q[i * 2 + 3], f) * hush];
  };

  // ── Flavors ────────────────────────────────────────────────────────────
  // A point takes the colour of the nearest flavor, so a flavor is just a position, and it rides
  // in its bead. As two beads pass through each other the border between them turns over, so
  // they cross as two liquids do, round each other.
  const flavorCentres = (w) => {
    const out = [0, 1, 2].map((j) => place(j, w)), seats = [0, 1, 2];
    let swirl = null;
    for (const k of SCENE.touches) {
      const mid = midOf(k), p = seats[k.a], q = seats[k.b];
      if (abs(w - mid) < .24) {
        const a = inFlight(k.a, w), b = inFlight(k.b, w), from = corner(p, w), to = corner(q, w), sx = to[0] - from[0], sy = to[1] - from[1], side = hypot(sx, sy);
        const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, half = max(hypot(a[0] - b[0], a[1] - b[1]) / 2, 4);
        const turned = PI * smooth(mid - .15, mid + .15, w), c = cos(turned), z = sin(turned);
        const dx = (sx * c - sy * z) / side * half, dy = (sx * z + sy * c) / side * half;
        out[k.a] = lifted(mx - dx, my - dy);
        out[k.b] = lifted(mx + dx, my + dy);
        swirl = { at: lifted(mx, my), by: SCENE.twist * sin(turned), size: half + SCENE.flight * 1.6, mixing: merging(k, w), a: k.a, b: k.b };
      }
      seats[k.a] = q; seats[k.b] = p;
    }
    return { centres: out, swirl };
  };

  // Everything nearer flavor c than the others, as a polygon, inside a box the outline will cut down.
  const cell = (c, centres, box) => {
    let poly = [[-box, -box], [box, -box], [box, box], [-box, box]];
    const p = centres[c];
    for (let o = 0; o < 3; o++) {
      if (o === c) continue;
      const q = centres[o], nx = q[0] - p[0], ny = q[1] - p[1];
      const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2;
      const side = (v) => (v[0] - mx) * nx + (v[1] - my) * ny;
      const kept = [];
      poly.forEach((v, i) => {
        const w = poly[(i + 1) % poly.length], a = side(v), b = side(w);
        if (a <= 0) kept.push(v);
        if ((a < 0 && b > 0) || (a > 0 && b < 0)) { const u = a / (a - b); kept.push([mix(v[0], w[0], u), mix(v[1], w[1], u)]); }
      });
      poly = kept;
    }
    return poly;
  };

  // Turn what's near the middle further than what's at the edge, which bends a straight border
  // into an S.
  const bent = (swirl) => (p) => {
    const dx = p[0] - swirl.x, dy = p[1] - swirl.y, u = 1 - hypot(dx, dy) / swirl.size;
    if (u <= 0) return p;
    const a = swirl.by * u * u, c = cos(a), z = sin(a);
    return [swirl.x + dx * c - dy * z, swirl.y + dx * z + dy * c];
  };
  const swirled = (poly, swirl) => {
    if (!swirl || abs(swirl.by) < .01) return poly;
    const out = [], bend = bent(swirl);
    poly.forEach((v, i) => {
      const w = poly[(i + 1) % poly.length];
      const len = hypot(w[0] - v[0], w[1] - v[1]);
      const steps = min(90, ceil(len / 1.2));
      // Only the part of an edge inside the swirl needs the extra points.
      const nearby = abs((w[0] - v[0]) * (v[1] - swirl.y) - (w[1] - v[1]) * (v[0] - swirl.x)) / (len || 1) < swirl.size;
      if (!nearby) { out.push(bend(v)); return; }
      const u0 = clamp(((swirl.x - v[0]) * (w[0] - v[0]) + (swirl.y - v[1]) * (w[1] - v[1])) / (len * len || 1));
      const span = swirl.size / (len || 1), a = clamp(u0 - span), b = clamp(u0 + span);
      out.push(bend(v));
      for (let u = 0; u <= steps; u++) {
        const f = mix(a, b, u / steps);
        out.push(bend([mix(v[0], w[0], f), mix(v[1], w[1], f)]));
      }
    });
    return out;
  };

  // ── The outline ────────────────────────────────────────────────────────
  const shape = (b, x, y) => {
    const dx = x - b.x, dy = y - b.y;
    const px = dx * b.cos + dy * b.sin, py = dy * b.cos - dx * b.sin;
    const k0 = hypot(px / b.rx, py / b.ry), k1 = hypot(px / (b.rx * b.rx), py / (b.ry * b.ry));
    return k1 ? k0 * (k0 - 1) / k1 : -min(b.rx, b.ry);
  };

  const field = (group, k, x, y) => {
    let d = shape(group[0], x, y);
    for (let i = 1; i < group.length; i++) {
      const e = shape(group[i], x, y), h = max(k - abs(d - e), 0) / k;
      d = min(d, e) - h * h * k / 4;
    }
    return d;
  };

  // Marching squares round a group of touching beads. Each cell adds a directed step, so the
  // steps chain into closed loops with the inside on one hand.
  const STEPS = [[], ['T', 'L'], ['R', 'T'], ['R', 'L'], ['B', 'R'], null, ['B', 'T'], ['B', 'L'],
    ['L', 'B'], ['T', 'B'], null, ['R', 'B'], ['L', 'R'], ['T', 'R'], ['L', 'T'], []];

  const contour = (group, k, cell) => {
    const pad = k + 2;
    const x0 = min(...group.map((b) => b.x - b.rx * 1.2)) - pad, x1 = max(...group.map((b) => b.x + b.rx * 1.2)) + pad;
    const y0 = min(...group.map((b) => b.y - b.rx * 1.2)) - pad, y1 = max(...group.map((b) => b.y + b.rx * 1.2)) + pad;
    const nx = ceil((x1 - x0) / cell), ny = ceil((y1 - y0) / cell), row = nx + 1;
    const v = new Float64Array(row * (ny + 1));
    for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) v[j * row + i] = field(group, k, x0 + i * cell, y0 + j * cell);

    const crossing = (e) => {
      const flat = e >> 1, i = flat % row, j = (flat - i) / row;
      const a = v[flat], b = e & 1 ? v[flat + row] : v[flat + 1], u = a / (a - b);
      return e & 1 ? [x0 + i * cell, y0 + (j + u) * cell] : [x0 + (i + u) * cell, y0 + j * cell];
    };
    const next = new Map();
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const at = j * row + i, a = v[at], b = v[at + 1], c = v[at + row + 1], d = v[at + row];
      const kind = (a < 0) + (b < 0) * 2 + (c < 0) * 4 + (d < 0) * 8;
      if (!kind || kind === 15) continue;
      const edge = { T: at * 2, B: (at + row) * 2, L: at * 2 + 1, R: (at + 1) * 2 + 1 };
      if (kind === 5 || kind === 10) {
        const mid = (a + b + c + d) / 4 < 0;
        const pairs = kind === 5 ? (mid ? [['T', 'R'], ['B', 'L']] : [['T', 'L'], ['B', 'R']])
          : (mid ? [['L', 'T'], ['R', 'B']] : [['R', 'T'], ['L', 'B']]);
        for (const [f, g] of pairs) next.set(edge[f], edge[g]);
      } else {
        const [f, g] = STEPS[kind];
        next.set(edge[f], edge[g]);
      }
    }
    const loops = [];
    while (next.size) {
      const start = next.keys().next().value, loop = [];
      let e = start;
      do {
        loop.push(crossing(e));
        const f = next.get(e);
        next.delete(e);
        e = f;
      } while (e !== start && e !== undefined);
      if (loop.length > 8) loops.push(loop);
    }
    return loops;
  };

  // Drop the points a straight line would pass within tol of.
  const thin = (pts, tol) => {
    if (pts.length < 4) return pts;
    const keep = new Uint8Array(pts.length), todo = [[0, pts.length >> 1], [pts.length >> 1, pts.length - 1]];
    keep[0] = keep[pts.length >> 1] = keep[pts.length - 1] = 1;
    while (todo.length) {
      const [a, b] = todo.pop(), p = pts[a], q = pts[b];
      const dx = q[0] - p[0], dy = q[1] - p[1], len = hypot(dx, dy) || 1;
      let worst = 0, at = -1;
      for (let i = a + 1; i < b; i++) {
        const d = abs((pts[i][0] - p[0]) * dy - (pts[i][1] - p[1]) * dx) / len;
        if (d > worst) { worst = d; at = i; }
      }
      if (worst > tol) { keep[at] = 1; todo.push([a, at], [at, b]); }
    }
    return pts.filter((_, i) => keep[i]);
  };

  const num = (x) => {
    const s = x.toFixed(2);
    return s.includes('.') ? s.replace(/\.?0+$/, '').replace(/^(-?)0\./, '$1.') || '0' : s;
  };
  const line = (pts, close) => {
    if (!pts.length) return 'M0 0';
    let d = `M${num(pts[0][0])} ${num(pts[0][1])}`;
    let [px, py] = [+num(pts[0][0]), +num(pts[0][1])];
    for (let i = 1; i < pts.length; i++) {
      const x = +num(pts[i][0]), y = +num(pts[i][1]);
      d += `l${num(x - px)} ${num(y - py)}`;
      px = x; py = y;
    }
    return close ? d + 'z' : d;
  };

  const lone = (b) => {
    const rot = num(atan2(b.sin, b.cos) * 180 / PI);
    const ax = b.x + b.rx * b.cos, ay = b.y + b.rx * b.sin, cx = b.x - b.rx * b.cos, cy = b.y - b.rx * b.sin;
    const arc = (x, y) => `A${num(b.rx)} ${num(b.ry)} ${rot} 1 1 ${num(x)} ${num(y)}`;
    return `M${num(ax)} ${num(ay)}${arc(cx, cy)}${arc(ax, ay)}z`;
  };

  // Whether two beads touch is a question for the world, not the frame: huge beads near the lens
  // look close together on the frame while they're nowhere near each other.
  const outline = (beads, k, detail, within) => {
    const seen = new Set();
    let d = '';
    for (const b of beads) {
      if (seen.has(b)) continue;
      const group = [b];
      seen.add(b);
      for (let i = 0; i < group.length; i++) for (const o of beads) {
        if (seen.has(o)) continue;
        const a = o.world, c = group[i].world;
        if (hypot(a[0] - c[0], a[1] - c[1], a[2] - c[2]) < within) { seen.add(o); group.push(o); }
      }
      if (group.length === 1) d += lone(b);
      else for (const loop of contour(group, k, detail.cell)) d += line(thin(loop, detail.tol), true);
    }
    return d;
  };

  // ── Stars ──────────────────────────────────────────────────────────────
  // Two boxes of stars that follow the camera, each star always at its nearest copy, so the field
  // never runs out however far they fly. The sky is the same thing much further away: they fly
  // past it just as fast, so it streaks outwards from the same point, only less.
  const DEPTHS_COUNT = 5;
  const FIELD = (() => {
    let seed = 20151006;   // the day the Nobel for oscillation was announced
    const rand = () => (seed = seed * 16807 % 2147483647) / 2147483647;
    const { field, size, sky, deep, still } = SCENE.stars, box = (n, s) => ({ size: s, stars: Array.from({ length: n }, () => [rand() * s, rand() * s, rand() * s]) });
    return {
      boxes: [box(field, size), box(sky, deep)],
      still: Array.from({ length: still }, (_, i) => {
        const z = rand() * 2 - 1, a = rand() * TAU, c = sqrt(1 - z * z), d = 60000 + rand() * 60000;
        return { at: [c * cos(a) * d, c * sin(a) * d, z * d], layer: DEPTHS_COUNT + (i % 9 ? (i % 3 ? 2 : 1) : 0) };
      }),
    };
  })();
  // The furthest are the faintest, so a star that comes into range doesn't pop.
  const DEPTHS = [{ to: 170, width: 1.2, alpha: .9 }, { to: 320, width: .85, alpha: .6 }, { to: 900, width: .55, alpha: .36 }, { to: 1800, width: .5, alpha: .26 }, { to: Infinity, width: .45, alpha: .14 }];
  const LAYERS = [...DEPTHS, { width: 1.3, alpha: .85 }, { width: .9, alpha: .55 }, { width: .6, alpha: .32 }];
  const tenth = (x) => { const s = x.toFixed(1); return s.endsWith('.0') ? s.slice(0, -2) : s.replace(/^(-?)0\./, '$1.'); };

  const starfield = (t, w, cam, r, cull) => {
    const { shutter, longest, shake } = SCENE.stars, back = w - shutter * rate(t), was = pose(back, r, shake), at = cam.at, paths = LAYERS.map(() => '');
    const streak = (which, x, y, ox, oy) => {
      let dx = ox - x, dy = oy - y;
      const len = hypot(dx, dy);
      if (len > longest) { dx *= longest / len; dy *= longest / len; }
      // Off the frame only if all of it is: a streak can leave its head outside and its tail in.
      if (min(x, x + dx) > cull[0] || max(x, x + dx) < -cull[0] || min(y, y + dy) > cull[1] || max(y, y + dy) < -cull[1]) return;
      if (!dx && !dy) dx = .01;   // WebKit's canvas drops a zero-length stroke
      paths[which] += `M${tenth(x)} ${tenth(y)}l${tenth(dx) === '0' && tenth(dy) === '0' ? '.1' : tenth(dx)} ${tenth(dy)}`;
    };
    for (const { size, stars } of FIELD.boxes) {
      const wrap = (v) => v - size * Math.round(v / size);
      for (const s of stars) {
        const p = [at[0] + wrap(s[0] - at[0]), at[1] + wrap(s[1] - at[1]), at[2] + wrap(s[2] - at[2])], a = project(cam, p);
        if (a.z < 16 || a.z > size / 2) continue;
        const b = project(was, p);
        streak(DEPTHS.findIndex((d) => a.z < d.to), a.x, a.y, b.z > 4 ? b.x : a.x, b.z > 4 ? b.y : a.y);
      }
    }
    // The farthest are too far away to pass, so they hold still and drift out ever so slowly,
    // which shows what the camera is doing. They're seen through the real shutter, not the long one
    // the others get, so they stay points, and only a fast pan draws them out.
    const quick = pose(w - SCENE.blur.shutter * rate(t), r, shake);
    for (const { at: p, layer } of FIELD.still) {
      const a = project(cam, p);
      if (a.z > 0) { const b = project(quick, p); streak(layer, a.x, a.y, b.x, b.y); }
    }
    return paths;
  };

  // ── Film damage ────────────────────────────────────────────────────────
  // A short loop of dust, in pixels of the frame. It's on the lens, not in the scene, so it never
  // reaches the clean film.
  const DAMAGE = (() => {
    let seed = 18951228;   // the Lumieres' first paying audience
    const rand = () => (seed = seed * 16807 % 2147483647) / 2147483647, x = () => (rand() * 2 - 1) * 200, y = () => (rand() * 2 - 1) * 170;
    const { frames, specks } = SCENE.post.damage;
    return Array.from({ length: frames }, () => {
      const paths = { dust: '', big: '' };
      for (let k = 0; k < specks; k++) paths[k % 3 ? 'dust' : 'big'] += `M${num(x())} ${num(y())}l.1 .1`;
      return [{ d: paths.dust, width: .6, alpha: .6 }, { d: paths.big, width: 1.2, alpha: .85 }];
    });
  })();

  // ── Nebulae ────────────────────────────────────────────────────────────
  // Each strand is a line of soft stamps, close enough to run together, along a stroke that leans a
  // little off their flight and bows, so they don't all point the same way.
  const CLOUDS = (() => {
    let seed = 19980605;   // the day Super-Kamiokande announced oscillation
    const rand = () => (seed = seed * 16807 % 2147483647) / 2147483647, between = ([a, b]) => mix(a, b, rand());
    const { strokes, length, away, width, strands, puff, pace } = SCENE.nebula, out = [];
    for (let i = 0; i < strokes; i++) {
      const s = mix(-pace * SCENE.speed * STOP - 500, 2400, (i + rand()) / strokes), a = rand() * TAU, side = toward(RIGHT, DOWN, ALONG, cos(a), sin(a), 0), over = cross(ALONG, side);
      const mid = toward(ALONG, side, over, s, between(away), 0), way = unit(toward(ALONG, side, over, 1, (rand() - .5) * .5, (rand() - .5) * .5));
      const long = between(length), size = between(width), bow = (rand() - .5) * size * 2, light = mix(.5, 1, rand());
      for (let k = 0; k < strands; k++) {
        const aside = (rand() - .5) * size * 1.3, fat = mix(.55, 1.1, rand()), steps = ceil(long / (size * fat * .7));
        for (let j = 0; j <= steps; j++) {
          const u = j / steps, round = sin(PI * u), d = (u - .5) * long, o = aside + bow * round;
          out.push({ at: [0, 1, 2].map((n) => mid[n] + way[n] * d + over[n] * o), r: size * fat * (.35 + .65 * round), alpha: puff * round });
        }
      }
    }
    return out;
  })();

  // ── Tails ──────────────────────────────────────────────────────────────
  const reachOf = curve(SCENE.comet.reach);
  const SLICES = [0, .1, .4, 1];
  const blendOf = (a, b) => {
    const parts = [1, 3, 5].map((i) => (parseInt(a.slice(i, i + 2), 16) + parseInt(b.slice(i, i + 2), 16)) / 2), mean = (parts[0] + parts[1] + parts[2]) / 3;
    return `#${parts.map((v) => round(clamp(mean + (v - mean) * 1.5, 0, 255)).toString(16).padStart(2, '0')).join('')}`;
  };
  // A strip along the way a bead has just come, from near to far units behind it, as wide as half
  // says at each point. round runs from flat ends at 0 to the mark's round ones at 1.
  const ribbon = (j, w, cam, near, far, half, round, tol) => {
    const { steps } = SCENE.comet, pts = [];
    for (let i = 0; i <= steps; i++) {
      const d = mix(near, far, i / steps), p = project(cam, wake(j, w, d));
      if (p.z < 12) break;
      pts.push({ ...p, d });
    }
    if (pts.length < 2) return null;
    const left = [], right = [], last = pts.length - 1;
    const sides = pts.map((p, i) => {
      const a = pts[max(i - 1, 0)], b = pts[min(i + 1, last)], dx = b.x - a.x, dy = b.y - a.y, l = hypot(dx, dy) || 1;
      const size = half(p.d) * mix(min(p.scale, 2.3), p.scale, round);   // it mustn't swell as it passes the lens
      left.push([p.x - dy / l * size, p.y + dx / l * size]);
      right.unshift([p.x + dy / l * size, p.y - dx / l * size]);
      return { tx: dx / l, ty: dy / l, size };
    });
    const end = (p, side, way) => {
      const out = [];
      if (round) for (let i = 1; i < 12; i++) {
        const a = PI * i / 12, c = cos(a) * side.size * way, z = sin(a) * side.size * round * way;
        out.push([p.x - side.ty * c + side.tx * z, p.y + side.tx * c + side.ty * z]);
      }
      return out;
    };
    const poly = [...left, ...end(pts[last], sides[last], 1), ...right, ...end(pts[0], sides[0], -1)];
    return { d: line(thin(poly, mix(tol, .012, round)), true), x1: pts[0].x, y1: pts[0].y, x2: pts[last].x, y2: pts[last].y };
  };

  // ── A frame ────────────────────────────────────────────────────────────
  const frame = (t, o = {}) => {
    const look = THEMES[o.theme || 'space'], r = rig(o), fine = o.detail || { cell: .55, tol: .03 };
    const w = clock(t), cam = pose(w, r);

    const spot = project(cam, middle(w));
    const sticky = 1 - smooth(SCENE.form[0] - .12, SCENE.form[0] + .02, w), reach = SCENE.cohesion * sticky, k = .01 + reach * spot.scale;
    const round3d = 1 - smooth(...SCENE.flat, w);
    const beads = [], lights = [], shades = [];
    [0, 1, 2].forEach((j) => {
      const world = bead(j, w), p = project(cam, world);
      if (p.z < 3) return;
      const [q0, q1] = stretch(j, t), e = hypot(q0, q1), dir = atan2(q1, q0) / 2, size = radius(w, j) * p.scale;
      beads[j] = { world, x: p.x, y: p.y, rx: size * (1 + e), ry: size / (1 + e), cos: cos(dir), sin: sin(dir), far: clamp((p.z - spot.z) / 36) };
    });
    // A bead's roundness fades as it joins another: the drop they make has no edge of its own to shade.
    // Judged on the frame, not in the world: leaning towards us, they overlap before they touch.
    // It starts as soon as the liquid reaches out, because from then on the outline is bigger than
    // the bead, and a bead's own edge would show as a ring inside it.
    const nearness = (k) => {
      const a = beads[k.a], b = beads[k.b];
      return a && b ? clamp(1 - (hypot(a.x - b.x, a.y - b.y) - a.rx - b.rx) / (k0 * 1.6)) : 0;
    };
    const k0 = max(1, k), joined = SCENE.touches.find((c) => abs(w - midOf(c)) < .36 && nearness(c) > 0);
    const one = joined ? smooth(0, .45, nearness(joined)) : 0;
    if (round3d) {
      beads.forEach((b, j) => {
        const share = joined && (j === joined.a || j === joined.b) ? 1 - one : 1;
        lights.push({ x: b.x, y: b.y, rx: b.rx * 1.03, ry: b.ry * 1.03, cos: b.cos, sin: b.sin, alpha: round3d * share });
        if (b.far) shades.push({ x: b.x, y: b.y, rx: b.rx * 1.06, ry: b.ry * 1.06, cos: b.cos, sin: b.sin, alpha: round3d * .3 * b.far * share });   // the far ones sit back in the dark
      });
    }

    // The threads: dead straight from bead to bead, swelling where they leave a bead and fine
    // between, half in each bead's colour. Once broken, each half shrinks back into its bead.
    const threads = [];
    for (const c of SCENE.touches) {
      const held = threadOf(c, w), a = beads[c.a], b = beads[c.b];
      if (!held || !a || !b) continue;
      const fineR = SCENE.thread.thin * spot.scale, reachOut = .5 * (1 - held.recoiled);
      [[a, b, c.a], [b, a, c.b]].forEach(([from, to, j]) => {
        const dx = to.x - from.x, dy = to.y - from.y, l = hypot(dx, dy) || 1, base = from.rx * SCENE.thread.base * (1 - .45 * held.stretch), side = [], back = [];
        for (let i = 0; i <= 8; i++) {
          const u = i / 8, along = l * reachOut * u, half = mix(base, fineR, smooth(0, .34, u)) * (held.recoiled ? 1 - u * u * held.recoiled : 1);
          side.push([from.x + dx / l * along - dy / l * half, from.y + dy / l * along + dx / l * half]);
          back.unshift([from.x + dx / l * along + dy / l * half, from.y + dy / l * along - dx / l * half]);
        }
        threads.push({ d: line([...side, ...back], true), color: look.flavors[j], key: `${c.a}${c.b}${j}` });
      });
    }

    // Where two drops meet the tube flares, up as they fall together and dying away as they part.
    const { rise, fade, height, size } = SCENE.tube.merge, meeting = SCENE.touches.find((c) => w > midOf(c) - rise && w < midOf(c) + fade);
    const near = meeting && beads[meeting.a], other = meeting && beads[meeting.b], since = meeting && w - midOf(meeting);
    const surge = near && other ? { x: (near.x + other.x) / 2, y: (near.y + other.y) / 2, size: size * spot.scale, heat: height * (since < 0 ? smooth(-rise, 0, since) : 1 - smooth(0, fade, since)) } : null;

    const { centres, swirl } = flavorCentres(w);
    const seats = centres.map((p) => { const a = project(cam, inWorld(w, p)); return [a.x, a.y]; });
    const about = swirl && project(cam, inWorld(w, swirl.at));
    const turn = swirl && { by: swirl.by, size: swirl.size * about.scale, x: about.x, y: about.y };
    const cells = [0, 1, 2].map((c) => ({ d: line(thin(swirled(cell(c, seats, 900), turn), .04), true), color: look.flavors[c] }));

    // Where two liquids meet they're mixing: a soft band of the colour they make together, along
    // the border and widening as the two become one.
    let mix2 = null;
    if (swirl && swirl.mixing > 0) {
      const a = seats[swirl.a], b = seats[swirl.b], dx = b[0] - a[0], dy = b[1] - a[1], l = hypot(dx, dy) || 1;
      const long = turn.size * 1.2, bend = bent(turn), pts = [];
      for (let i = -9; i <= 9; i++) pts.push(bend([turn.x - dy / l * long * i / 9, turn.y + dx / l * long * i / 9]));
      mix2 = { d: line(pts, false), color: blendOf(look.flavors[swirl.a], look.flavors[swirl.b]), width: SCENE.flight * about.scale * (.5 + 2.6 * swirl.mixing), alpha: min(1, swirl.mixing * 2.5) };
    }

    // One tail per bead, in three pieces. In flight they run end to end, a faint even ribbon that's
    // dimmest right behind the bead and fades again far away. As it comes home the pieces part,
    // even out and round off into the mark's three dashes, so nothing has to swap for the logo.
    const tails = [], home = smooth(...SCENE.comet.home, w), long = reachOf(w), { width, light } = SCENE.comet;
    [0, 1, 2].forEach((j) => {
      const color = look.flavors[j], clear = SCENE.flight * 1.6;
      const fading = (d) => light * smooth(clear, clear * 5, d) * (1 - .7 * smooth(90, long, d));
      MARK.tail.forEach(({ from, to, alpha }, piece) => {
        const a = long * SLICES[piece], b = long * SLICES[piece + 1], near = mix(a, from, home), far = mix(b, to, home);
        const half = () => mix(width, MARK.tailWidth / 2, home);
        const shape = ribbon(j, w, cam, near, far, half, home, fine.tail || .07);
        if (shape) tails.push({ ...shape, color, start: mix(fading(a), alpha, home), end: mix(fading(b), alpha, home), key: `${j}${piece}` });
      });
    });

    const u = t - SCENE.ring, mark = spot.scale;
    const rings = u <= 0 ? [] : [
      { x: spot.x, y: spot.y, r: 124 * mark * (1 - exp(-u / .26)), width: 2.6 * mark * exp(-u / .5), alpha: .6 * exp(-u / .17), color: look.ring },
      { x: spot.x, y: spot.y, r: max(.01, MARK.ring * mark * spring(u, 15, .6)), width: (MARK.ringWidth + 6 * exp(-u / .08)) * mark, alpha: 1, color: look.ring },
    ];

    const shine = o.stars === false ? 0 : mix(1, o.print ? 1 : SCENE.stars.rest, smooth(...SCENE.stars.fade, t)), sky = shine ? pose(w, r, SCENE.stars.shake) : null;
    const stars = !shine ? [] : starfield(t, w, sky, r, o.cull || [320, 320]).map((d, i) => ({ d, width: LAYERS[i].width, alpha: LAYERS[i].alpha * shine, color: look.star }));
    const mist = [], thins = mix(1, o.print ? 1 : SCENE.nebula.rest, smooth(...SCENE.stars.fade, t)), [wideX, wideY] = o.cull || [320, 320], onward = (SCENE.nebula.pace - 1) * SCENE.speed * (w - STOP);
    if (sky) for (const along of o.print ? [-3000, -1500, 0, 1500, 3000] : [0]) for (const c of CLOUDS) {   // a still has no flight to bring them past, so it gets them all at once
      const q = project(sky, [0, 1, 2].map((n) => c.at[n] - ALONG[n] * (onward + along))), size = c.r * q.scale;
      if (q.z < 20 || abs(q.x) - size > wideX || abs(q.y) - size > wideY) continue;
      const a = c.alpha * thins * smooth(20, 240, q.z) * (1 - smooth(1000, 3400, q.z));
      if (a > .002) mist.push({ x: q.x, y: q.y, r: size, alpha: a });
    }

    return { t, bg: look.bg, stars, mist, rings, tails, shining: 1 - home, mix: mix2, shades, threads, surge, mass: outline(beads.filter(Boolean), k, fine, radius(w) * 2 + reach), cells, lights, word: lettering(t, r, look, o) };
  };

  // The name arrives once the world has stopped: each letter jumps up from the line it stands on
  // and bounces to rest, then the dot drops onto its i.
  const lettering = (t, r, look, o) => {
    if (o.wordmark === false) return null;
    const { at, stagger, pace } = SCENE.lockup, base = r.size * 15, echoes = [];
    let pen = r.word;
    const letters = GLYPHS.map((g, i) => {
      const u = (t - at - i * stagger) * pace, up = spring(u, 26, .34), wide = spring(u, 19, .5);
      const letter = { d: g.d, x: pen + g.width * r.size / 2, y: base, sx: r.size * wide, sy: r.size * up, shift: -g.width / 2 };
      // As each letter bounces, slices of it in the three flavors fall away below, as on a video wall.
      [3, 2, 1].forEach((e) => {
        const late = u - e * .028, away = e * 8.5 * exp(-u * 4.6);
        if (late > 0 && away > .2) echoes.push({ ...letter, y: base + away, sx: r.size * spring(late, 19, .5), sy: r.size * spring(late, 26, .34), color: look.flavors[e - 1] });
      });
      pen += g.width * r.size;
      return letter;
    });
    const host = letters[DOT.glyph], u = (t - at - GLYPHS.length * stagger - .1) * pace;
    const drop = u <= 0 ? null : { d: DOT.d, x: host.x, y: base - 64 * r.size * abs(cos(10 * u)) * exp(-4.6 * u), size: r.size, shift: host.shift, color: look.ring };
    return { letters, echoes, drop, color: look.ring };
  };

  // ── Drawing ────────────────────────────────────────────────────────────
  // Each draws on a 2D context with the scene's origin at the context's origin, a unit to scale.
  const drawStars = (ctx, f) => {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const s of f.stars) {
      ctx.globalAlpha = s.alpha; ctx.strokeStyle = s.color; ctx.lineWidth = s.width;
      ctx.stroke(new Path2D(s.d));
    }
    for (const r of f.rings) {
      ctx.globalAlpha = r.alpha; ctx.strokeStyle = r.color; ctx.lineWidth = r.width;
      ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, TAU); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  };

  // The stars' halo: the same strokes, blue and wide, for the lens to blur.
  const drawGlow = (ctx, f, wider) => {
    ctx.lineCap = 'round'; ctx.strokeStyle = SCENE.stars.glow;
    for (const s of f.stars) {
      ctx.globalAlpha = s.alpha; ctx.lineWidth = s.width * SCENE.stars.halo * wider;
      ctx.stroke(new Path2D(s.d));
    }
    ctx.globalAlpha = 1;
  };

  const drawDamage = (ctx, t) => {
    const { opacity, rate } = SCENE.post.damage;
    ctx.lineCap = 'round'; ctx.strokeStyle = '#f2ecdf';
    for (const { d, width, alpha: a } of DAMAGE[floor(max(t, 0) * rate) % DAMAGE.length]) {
      if (!d) continue;
      ctx.globalAlpha = a * opacity; ctx.lineWidth = width;
      ctx.stroke(new Path2D(d));
    }
    ctx.globalAlpha = 1;
  };

  const alpha = (hex, a) => hex + round(clamp(a) * 255).toString(16).padStart(2, '0');
  const drawTails = (ctx, f, faint = 1) => {
    for (const c of f.tails) {
      const g = ctx.createLinearGradient(c.x1, c.y1, c.x2, c.y2);
      g.addColorStop(0, alpha(c.color, c.start * faint)); g.addColorStop(1, alpha(c.color, c.end * faint));
      ctx.fillStyle = g;
      ctx.fill(new Path2D(c.d));
    }
  };

  const drawBody = (ctx, f) => {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.save();
    ctx.clip(new Path2D(f.mass));
    for (const c of f.cells) {
      const shape = new Path2D(c.d);
      ctx.fillStyle = ctx.strokeStyle = c.color; ctx.lineWidth = .35;
      ctx.fill(shape); ctx.stroke(shape);
    }
    // Where two liquids mix: a soft band, built from strokes laid over each other.
    if (f.mix) {
      ctx.strokeStyle = f.mix.color; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      const path = new Path2D(f.mix.d);
      for (let i = MIXING; i > 0; i--) {
        ctx.globalAlpha = .26 * f.mix.alpha; ctx.lineWidth = f.mix.width * i / MIXING;
        ctx.stroke(path);
      }
      ctx.globalAlpha = 1;
    }
    // A soft roundness, no shine: a little lighter towards the light, darker at the edge.
    for (const l of f.shades) {
      ctx.save();
      ctx.transform(l.cos * l.rx, l.sin * l.rx, -l.sin * l.ry, l.cos * l.ry, l.x, l.y);
      ctx.globalAlpha = l.alpha; ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.arc(0, 0, 1, 0, TAU); ctx.fill();
      ctx.restore();
    }
    for (const l of f.lights) {
      ctx.save();
      ctx.transform(l.cos * l.rx, l.sin * l.rx, -l.sin * l.ry, l.cos * l.ry, l.x, l.y);
      const g = ctx.createRadialGradient(-.16, -.2, 0, 0, 0, 1);
      SHADE.forEach(([at, colour]) => g.addColorStop(at, colour));
      ctx.globalAlpha = l.alpha; ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(0, 0, 1, 0, TAU); ctx.fill();
      ctx.restore();
    }
    ctx.restore();
    for (const t of f.threads) {
      ctx.fillStyle = t.color;
      ctx.fill(new Path2D(t.d));
    }
    if (!f.word) return;
    const letter = (l, colour) => {
      if (!l.sy) return;
      ctx.save();
      ctx.fillStyle = colour;
      ctx.translate(l.x, l.y); ctx.scale(l.sx, l.sy); ctx.translate(l.shift, 0);
      ctx.fill(new Path2D(l.d));
      ctx.restore();
    };
    ctx.globalAlpha = 1;
    for (const e of f.word.echoes) letter(e, e.color);
    for (const l of f.word.letters) letter(l, f.word.color);
    const d = f.word.drop;
    if (d) letter({ d: d.d, x: d.x, y: d.y, sx: d.size, sy: d.size, shift: d.shift }, d.color);
  };
  const draw = (ctx, f) => { drawStars(ctx, f); drawTails(ctx, f); drawBody(ctx, f); };
  const MIXING = 6;
  const SHADE = [[0, 'rgba(255,255,255,.13)'], [.5, 'rgba(255,255,255,.03)'], [.76, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,.34)']];

  const fit = (width, height, how) => (how === 'cover' ? max : min)(width / SCENE.wide, height / SCENE.view);

  // ── The lens and the tube ──────────────────────────────────────────────
  // The film seen through a real shutter and an old monitor. The shutter is honest motion blur:
  // several moments of the film laid over each other. Then the tube, in WebGL: phosphor bloom,
  // colours drifting apart at the edges, scanlines and a grille, grain, and a dark corner to the
  // glass. With no WebGL it just shows the film.
  const VERT = 'attribute vec2 p;varying vec2 uv;void main(){uv=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
  const BRIGHT = `precision mediump float;varying vec2 uv;uniform sampler2D src;
    void main(){vec3 c=texture2D(src,uv).rgb;float l=max(c.r,max(c.g,c.b));gl_FragColor=vec4(c*c*smoothstep(.2,.75,l),1.);}`;
  const SOFTEN = `precision mediump float;varying vec2 uv;uniform sampler2D src;uniform vec2 by;
    void main(){vec3 c=texture2D(src,uv).rgb*.2;
    c+=(texture2D(src,uv+by).rgb+texture2D(src,uv-by).rgb)*.18;
    c+=(texture2D(src,uv+by*2.2).rgb+texture2D(src,uv-by*2.2).rgb)*.13;
    c+=(texture2D(src,uv+by*3.6).rgb+texture2D(src,uv-by*3.6).rgb)*.07;
    c+=(texture2D(src,uv+by*5.).rgb+texture2D(src,uv-by*5.).rgb)*.03;
    gl_FragColor=vec4(c,1.);}`;
  const GAUSS = `precision mediump float;varying vec2 uv;uniform sampler2D src;uniform vec2 by;
    void main(){vec3 c=texture2D(src,uv).rgb*.2006;
    c+=(texture2D(src,uv+by).rgb+texture2D(src,uv-by).rgb)*.177;
    c+=(texture2D(src,uv+by*2.).rgb+texture2D(src,uv-by*2.).rgb)*.1216;
    c+=(texture2D(src,uv+by*3.).rgb+texture2D(src,uv-by*3.).rgb)*.0651;
    c+=(texture2D(src,uv+by*4.).rgb+texture2D(src,uv-by*4.).rgb)*.0271;
    c+=(texture2D(src,uv+by*5.).rgb+texture2D(src,uv-by*5.).rgb)*.0088;
    gl_FragColor=vec4(c,1.);}`;
  const SHARP = `precision mediump float;varying vec2 uv;uniform sampler2D src;uniform vec2 by;uniform float amount;
    void main(){vec3 c=texture2D(src,uv).rgb;vec2 e=by*.7071;
    vec3 w=texture2D(src,uv+vec2(by.x,0.)).rgb+texture2D(src,uv-vec2(by.x,0.)).rgb+texture2D(src,uv+vec2(0.,by.y)).rgb+texture2D(src,uv-vec2(0.,by.y)).rgb;
    w+=texture2D(src,uv+e).rgb+texture2D(src,uv-e).rgb+texture2D(src,uv+vec2(e.x,-e.y)).rgb+texture2D(src,uv+vec2(-e.x,e.y)).rgb;
    gl_FragColor=vec4(clamp(c+(c-w*.125)*amount,0.,1.),1.);}`;
  const SHRINK = `precision mediump float;varying vec2 uv;uniform sampler2D src;uniform vec2 by;
    void main(){gl_FragColor=vec4((texture2D(src,uv+by).rgb+texture2D(src,uv-by).rgb+texture2D(src,uv+vec2(by.x,-by.y)).rgb+texture2D(src,uv+vec2(-by.x,by.y)).rgb)*.25,1.);}`;
  const GROW = `precision mediump float;varying vec2 uv;uniform sampler2D src;uniform vec2 by;
    void main(){vec2 x=vec2(by.x*2.,0.),y=vec2(0.,by.y*2.);
    vec3 c=texture2D(src,uv+x).rgb+texture2D(src,uv-x).rgb+texture2D(src,uv+y).rgb+texture2D(src,uv-y).rgb;
    c+=(texture2D(src,uv+by).rgb+texture2D(src,uv-by).rgb+texture2D(src,uv+vec2(by.x,-by.y)).rgb+texture2D(src,uv+vec2(-by.x,by.y)).rgb)*2.;
    gl_FragColor=vec4(c/12.,1.);}`;
  const TUBE = `precision highp float;varying vec2 uv;
    uniform sampler2D src,pic,deep,near,far,mist;uniform vec2 res;uniform float time,lines,glow,halo,amount,scan,bloom,fringe,trail,wide,spread,haze,lens,edge,exposure,grain,speck,seed;uniform vec3 streak,tint;uniform vec4 flare,spot;
    float noise(vec2 p){vec3 q=fract(vec3(p.xyx)*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
    void main(){
      vec3 clean=texture2D(src,uv).rgb;
      vec2 c=uv-.5;float r=dot(c,c);
      float d=uv.x-flare.x,lit=max(flare.w,flare.z*(d>0.?exp(-d*d/(flare.y*flare.y)):exp(d/trail)));
      vec2 s=(uv-spot.xy)*vec2(res.x/res.y,1.)/spot.z;float heat=spot.w*exp(-dot(s,s));
      vec2 drift=c*(lens+(.0022+.012*r)*edge)+vec2(fringe*(lit+heat*spread),0.);
      vec3 col=vec3(texture2D(pic,uv+drift).r,texture2D(pic,uv).g,texture2D(pic,uv-drift).b);
      col+=vec3(texture2D(deep,uv+drift).r,texture2D(deep,uv).g,texture2D(deep,uv-drift).b)*exposure*(1.-min(max(col.r,max(col.g,col.b)),1.));
      float more=1.+(bloom-1.)*lit;
      vec3 glowing=vec3(texture2D(near,uv+drift*2.).r,texture2D(near,uv).g,texture2D(near,uv-drift*2.).b);
      col+=glowing*glow*(more+heat*.6)+texture2D(far,uv).rgb*halo*(more+heat*wide);
      float cloud=1.-exp(-texture2D(mist,uv).r*2.2);col+=(tint+vec3(.04,.2,.25)*cloud)*cloud*haze*(1.-min(max(col.r,max(col.g,col.b)),1.));
      float ax=abs(uv.x-spot.x)/(streak.x*(.5+spot.w)),ay=(uv.y-spot.y)/streak.y;
      ay*=1.+1.6*min(ax,1.);
      col+=mix(vec3(.72,.86,1.),vec3(.22,.46,1.),min(ax*1.5,1.))*exp(-ax)*(exp(-ay*ay)+.32*exp(-ay*ay*.016))*spot.w*streak.z;
      float line=.5+.5*cos(uv.y*lines*6.28318),wire=.5+.5*cos(uv.x*lines*res.x/res.y*2.*6.28318);
      float l=dot(col,vec3(.3,.59,.11));
      col=min(col,vec3(1.1));
      col*=mix(1.,.62+.62*line,scan*(.8-.45*smoothstep(.5,1.2,l)));
      col*=mix(1.,.93+.09*wire,scan*smoothstep(1.7,2.8,res.y/lines*.5));
      col*=vec3(1.02,1.,.95);
      col*=1.-r*1.05;
      col=col*(.985+.015*sin(time*97.))+vec3(.008,.008,.012);
      vec2 g=uv*res/speck;
      col+=(noise(floor(g)+seed)+noise(floor(g+.5)+seed+17.)-1.)*grain;
      gl_FragColor=vec4(mix(clean,col,amount),1.);
    }`;

  // Where the tube stands at a moment: how much scanline, where the crest is, how high it is, and
  // how lit everything is. Places are in the film's units here, and the shader wants shares of the frame.
  const tubeAt = (t, o) => {
    const { quiet, full, back, rest, crest, flare, alone } = SCENE.tube, named = o.wordmark !== false, [a, b, c, d] = named ? flare : alone;
    return {
      scan: o.print ? 0 : mix(quiet, full, smooth(...back, t)), at: rig(o).crest(t), height: named ? crest.height * smooth(...crest.rise, t) * (1 - smooth(...crest.fall, t)) : 0,
      all: smooth(a, b, t) * mix(1, rest, smooth(c, d, t)),
    };
  };

  const glTube = (gl) => {
    const shader = (kind, code) => { const s = gl.createShader(kind); gl.shaderSource(s, code); gl.compileShader(s); return s; };
    const program = (code) => {
      const p = gl.createProgram();
      gl.attachShader(p, shader(gl.VERTEX_SHADER, VERT)); gl.attachShader(p, shader(gl.FRAGMENT_SHADER, code));
      gl.bindAttribLocation(p, 0, 'p'); gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || 'shader');
      return p;
    };
    const bright = program(BRIGHT), soften = program(SOFTEN), gauss = program(GAUSS), sharp = program(SHARP), down = program(SHRINK), up = program(GROW), tube = program(TUBE);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    const texture = () => {
      const t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
      return t;
    };
    const target = () => ({ tex: texture(), fbo: gl.createFramebuffer(), w: 0, h: 0 });
    const size = (b, w, h) => {
      if (b.w === w && b.h === h) return;
      b.w = w; b.h = h;
      gl.bindTexture(gl.TEXTURE_2D, b.tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.bindFramebuffer(gl.FRAMEBUFFER, b.fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, b.tex, 0);
    };
    const source = texture(), a = target(), b = target(), c = target(), d = target(), e = target(), f = target(), g = target(), levels = Array.from({ length: 7 }, target), cloud = texture();
    for (const t of [e, f, g, ...levels]) size(t, 2, 2);
    gl.bindTexture(gl.TEXTURE_2D, cloud);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));
    const bind = (unit, tex) => { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, tex); };
    const pass = (p, into, w, h, set) => {
      gl.bindFramebuffer(gl.FRAMEBUFFER, into ? into.fbo : null);
      gl.viewport(0, 0, w, h);
      gl.useProgram(p); set(p);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const u = (p, n) => gl.getUniformLocation(p, n);
    const draw = (program, from, to, w, h, x, y, set) => pass(program, to, w, h, (p) => { bind(0, from); gl.uniform1i(u(p, 'src'), 0); gl.uniform2f(u(p, 'by'), x, y); if (set) set(p); });
    const blur = (from, to, w, h, x, y) => draw(soften, from.tex, to, w, h, x / w, y / h);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    return (image, W, H, t, amount, state) => {
      const { lines, glow, halo } = SCENE.grade, { bloom, fringe, merge } = SCENE.tube, { blur: sigma, sharpen, glow: deep, aberration, edge, grain } = SCENE.post;
      bind(0, source);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      const w4 = max(2, W >> 2), h4 = max(2, H >> 2), w12 = max(2, W >> 4), h12 = max(2, H >> 4);
      size(a, w4, h4); size(b, w4, h4); size(c, w12, h12); size(d, w12, h12);
      pass(bright, a, w4, h4, (p) => { bind(0, source); gl.uniform1i(u(p, 'src'), 0); });
      blur(a, b, w4, h4, 1.25, 0); blur(b, a, w4, h4, 0, 1.25);
      blur(a, c, w12, h12, 1, 0); blur(c, d, w12, h12, 0, 1); blur(d, c, w12, h12, 1.6, 0); blur(c, d, w12, h12, 0, 1.6);
      // The finish: blur, sharpen, then the deep glow, at half size, since nothing that's been blurred
      // needs more. The glow goes down a level at a time and comes back up, mixing each into the
      // next, so each doubling of the radius brings a quarter of the light of the one before.
      let depth = 0;
      if (amount) {
        const w2 = max(2, W >> 1), h2 = max(2, H >> 1), reach = sigma * state.unit;
        size(e, w2, h2); size(f, w2, h2); size(g, w2, h2);
        draw(gauss, source, e, w2, h2, reach / 2 / W, 0);
        draw(gauss, e.tex, f, w2, h2, 0, reach / 2 / H);
        draw(sharp, f.tex, g, w2, h2, reach / W, reach / H, (p) => gl.uniform1f(u(p, 'amount'), sharpen));
        depth = clamp(round(Math.log2(max(2, deep.radius * state.unit / 4))) - 1, 1, levels.length);
        for (let i = 0; i < depth; i++) {
          const w = max(2, W >> (i + 2)), h = max(2, H >> (i + 2));
          size(levels[i], w, h);
          draw(down, (i ? levels[i - 1] : g).tex, levels[i], w, h, .5 / w, .5 / h);
        }
        gl.enable(gl.BLEND); gl.blendColor(0, 0, 0, .6); gl.blendFunc(gl.CONSTANT_ALPHA, gl.ONE_MINUS_CONSTANT_ALPHA);
        for (let i = depth - 2; i >= 0; i--) draw(up, levels[i + 1].tex, levels[i], levels[i].w, levels[i].h, .6 / levels[i + 1].w, .6 / levels[i + 1].h);
        gl.disable(gl.BLEND);
      }
      bind(3, cloud);
      if (state.mist) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, state.mist);
      pass(tube, null, W, H, (p) => {
        bind(0, source); bind(1, a.tex); bind(2, d.tex); bind(3, cloud); bind(4, g.tex); bind(5, levels[0].tex);
        gl.uniform1i(u(p, 'src'), 0); gl.uniform1i(u(p, 'near'), 1); gl.uniform1i(u(p, 'far'), 2); gl.uniform1i(u(p, 'mist'), 3); gl.uniform1i(u(p, 'pic'), 4); gl.uniform1i(u(p, 'deep'), 5);
        gl.uniform1f(u(p, 'lens'), aberration); gl.uniform1f(u(p, 'edge'), state.print ? 0 : edge); gl.uniform1f(u(p, 'exposure'), deep.exposure); gl.uniform3f(u(p, 'tint'), ...SCENE.nebula.tint);
        gl.uniform1f(u(p, 'grain'), state.print ? grain.lightness * .4 : grain.lightness); gl.uniform1f(u(p, 'speck'), grain.size * state.unit); gl.uniform1f(u(p, 'seed'), floor(t * grain.speed) * 37);
        gl.uniform1f(u(p, 'haze'), state.mist ? SCENE.nebula.light * (state.print ? 1.5 : 1) : 0);
        gl.uniform2f(u(p, 'res'), W, H); gl.uniform1f(u(p, 'time'), t);
        gl.uniform1f(u(p, 'lines'), min(lines, H / 2.6)); gl.uniform1f(u(p, 'glow'), glow); gl.uniform1f(u(p, 'halo'), halo);
        gl.uniform1f(u(p, 'amount'), amount);
        gl.uniform1f(u(p, 'scan'), state.scan); gl.uniform1f(u(p, 'bloom'), bloom); gl.uniform1f(u(p, 'fringe'), fringe);
        gl.uniform4f(u(p, 'flare'), state.at, state.width, state.height, state.all); gl.uniform1f(u(p, 'trail'), state.trail);
        gl.uniform4f(u(p, 'spot'), ...state.spot); gl.uniform1f(u(p, 'wide'), merge.wide); gl.uniform1f(u(p, 'spread'), merge.spread); gl.uniform3f(u(p, 'streak'), ...merge.streak);
      });
    };
  };

  //   theme, heading, stars, wordmark    as for frame()
  //   clear      no background and no tube, for laying the film over something else
  //   grade      false for the plain film
  //   samples    how many moments the shutter sees
  //   limit      the widest it draws before the tube scales it up
  //   unit       how big the finish is, where 1 is its size at 1080p; by default it's 1080p's by the pixel
  //   print      a still to hang: the sky stays full, with no dust or scanlines, no drift at the
  //              edges of the glass, and only enough grain to keep the gradients smooth
  const surface = (canvas, o = {}) => {
    const layer = () => { const c = document.createElement('canvas'); return [c, c.getContext('2d')]; };
    const [base, b] = layer(), [pile, p] = layer(), [sub, s] = layer(), [aura, a] = layer(), [wide, c] = layer(), [mist, m] = layer(), [puff, q] = layer();
    puff.width = puff.height = 64;
    const soft = q.createRadialGradient(32, 32, 0, 32, 32, 32);
    for (const [at, v] of [[0, 1], [.25, .62], [.5, .25], [.75, .06], [1, 0]]) soft.addColorStop(at, `rgba(255,255,255,${v})`);
    q.fillStyle = soft; q.fillRect(0, 0, 64, 64);
    const gl = o.clear ? null : canvas.getContext('webgl', { alpha: false, antialias: false, preserveDrawingBuffer: true });
    let show = null, plain = null;
    if (gl) try { show = glTube(gl); } catch (e) { show = null; }
    if (!gl) plain = canvas.getContext('2d');
    const { lockup, blur } = SCENE, settled = lockup.at + lockup.stagger * GLYPHS.length + 1;

    const paint = (t) => {
      const W = canvas.width, H = canvas.height;
      if (!W || !H) return;   // not laid out yet, or hidden: the player paints again when it has a size
      const k = o.grade === false ? 1 : min(1, (o.limit || 1600) / W), w = round(W * k), h = round(H * k);   // the tube is soft anyway
      for (const l of [base, pile, sub]) if (l.width !== w || l.height !== h) { l.width = w; l.height = h; }
      const ax = ceil(w / 7), ay = ceil(h / 7), wx = ceil(w / 21), wy = ceil(h / 21);
      if (aura.width !== ax || aura.height !== ay) { aura.width = ax; aura.height = ay; wide.width = wx; wide.height = wy; }
      const scale = o.view ? min(w, h) / o.view : fit(w, h, o.fit), [fx, fy] = o.focus || [0, 0], x = w / 2 - fx * scale, y = h / 2 - fy * scale;
      const samples = t >= settled ? 1 : (o.samples || blur.live), first = frame(t, o);
      // The finish is measured in pixels of the frame, not in the scene, so showing more of the scene
      // leaves it the same size. ruler is a unit of the finish, 5.4 pixels at 1080p, on this canvas.
      const unit = o.unit || min(W, H) / 1080, ruler = 5.4 * unit * k;
      const rest = { ...o, stars: false, detail: { cell: .9, tol: .06, tail: .2 } };   // blur hides the difference

      b.setTransform(1, 0, 0, 1, 0, 0); b.globalAlpha = 1; b.clearRect(0, 0, w, h);
      if (!o.clear) { b.fillStyle = first.bg; b.fillRect(0, 0, w, h); }
      b.setTransform(scale, 0, 0, scale, x, y);
      drawStars(b, first);

      // A halo: drawn small and scaled back up, which blurs it, and added on as light. It comes back
      // up through four copies half a pixel of wide apart, or thin tails show its grid as a saw edge.
      const halo = (shapes, amount) => {
        a.setTransform(1, 0, 0, 1, 0, 0); a.clearRect(0, 0, ax, ay);
        a.setTransform(scale / 7, 0, 0, scale / 7, x / 7, y / 7);
        shapes();
        c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, wx, wy);
        c.imageSmoothingQuality = 'high'; c.drawImage(aura, 0, 0, wx, wy);
        a.setTransform(1, 0, 0, 1, 0, 0); a.clearRect(0, 0, ax, ay); a.imageSmoothingQuality = 'high'; a.globalCompositeOperation = 'lighter'; a.globalAlpha = .25;
        for (const [dx, dy] of [[-1.5, -1.5], [1.5, -1.5], [-1.5, 1.5], [1.5, 1.5]]) a.drawImage(wide, dx, dy, ax, ay);
        a.globalCompositeOperation = 'source-over'; a.globalAlpha = 1;
        b.setTransform(1, 0, 0, 1, 0, 0); b.imageSmoothingQuality = 'high'; b.globalCompositeOperation = 'lighter';
        b.globalAlpha = amount; b.drawImage(aura, 0, 0, w, h);
        b.globalCompositeOperation = 'source-over'; b.globalAlpha = 1;
      };
      if (!o.clear && o.grade !== false) {
        if (first.stars.length) halo(() => drawGlow(a, first, ruler / scale), SCENE.stars.light);
        if (first.shining) halo(() => { drawTails(a, first); drawBody(a, { ...first, word: null, lights: [], shades: [], mix: null }); }, first.shining);
      }

      p.setTransform(1, 0, 0, 1, 0, 0); p.globalCompositeOperation = 'source-over'; p.globalAlpha = 1; p.clearRect(0, 0, w, h);
      p.globalCompositeOperation = 'lighter'; p.globalAlpha = 1 / samples;
      for (let i = 0; i < samples; i++) {
        const f = i ? frame(t - blur.shutter * i / samples, rest) : first;
        s.setTransform(1, 0, 0, 1, 0, 0); s.clearRect(0, 0, w, h);
        s.setTransform(scale, 0, 0, scale, x, y);
        drawTails(s, f, o.clear || o.grade === false ? 1 : mix(1, .55, f.shining)); drawBody(s, f);
        p.drawImage(sub, 0, 0);
      }
      b.setTransform(1, 0, 0, 1, 0, 0); b.globalAlpha = 1;
      b.drawImage(pile, 0, 0);
      const finished = show && o.grade !== false && o.theme !== 'light' && !o.print;
      if (finished) { b.setTransform(ruler, 0, 0, ruler, w / 2, h / 2); drawDamage(b, t); }

      const state = tubeAt(t, o), { width, trail } = SCENE.tube.crest;
      const spot = first.surge ? [(x + first.surge.x * scale) / w, 1 - (y + first.surge.y * scale) / h, first.surge.size * ruler / h, first.surge.heat] : [0, 0, 1, 0];
      // The nebulae go to the tube on their own at full strength, or gradients this faint would band.
      if (show && first.mist.length) {
        const mx = ceil(w / 8), my = ceil(h / 8);
        if (mist.width !== mx || mist.height !== my) { mist.width = mx; mist.height = my; }
        m.setTransform(1, 0, 0, 1, 0, 0); m.globalCompositeOperation = 'source-over'; m.globalAlpha = 1; m.fillStyle = '#000'; m.fillRect(0, 0, mx, my);
        m.setTransform(scale / 8, 0, 0, scale / 8, x / 8, y / 8); m.globalCompositeOperation = 'lighter';
        for (const l of first.mist) { m.globalAlpha = l.alpha; m.drawImage(puff, l.x - l.r, l.y - l.r, l.r * 2, l.r * 2); }
      }
      if (show) show(base, W, H, t, o.grade === false || o.theme === 'light' ? 0 : 1, { ...state, print: o.print, unit, mist: first.mist.length ? mist : null, at: (x + state.at * scale) / w, width: width * ruler / w, trail: trail * ruler / w, spot });
      else if (plain) { plain.clearRect(0, 0, W, H); plain.drawImage(base, 0, 0, W, H); }
    };
    return { paint };
  };

  // Plays on a canvas that the page sizes with CSS, sharp at any size. The film ends on the mark
  // and its name, and stays there. Anything that asked for less motion gets that straight away.
  //   everything surface() takes
  //   cut        'full' or 'splash', or [from, to] in seconds
  //   clear      draw no background, for laying it over a page
  //   fit        'contain' keeps the whole lockup in view, 'cover' fills the canvas
  //   onframe    each frame, with the time
  //   onend      when it's done
  const CUTS = { full: [0, T], splash: [3.25, 4.1] };   // the splash goes with wordmark: false

  const mount = (canvas, o = {}) => {
    const [from, to] = Array.isArray(o.cut) ? o.cut : CUTS[o.cut || 'full'], film = surface(canvas, o);
    const calm = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    let now = from, stop = to, raf = 0, last = 0, ended = false;

    const paint = () => {
      const ratio = devicePixelRatio || 1, w = round(canvas.clientWidth * ratio), h = round(canvas.clientHeight * ratio);
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      film.paint(now);
    };
    const tick = (ms) => {
      now = min(stop, now + min((ms - last) / 1000, .25));   // keeps real time on a slow screen, without leaping after a hidden tab
      last = ms;
      paint();
      if (o.onframe) o.onframe(now);
      if (now < stop) { raf = requestAnimationFrame(tick); return; }
      raf = 0;
      if (!ended) { ended = true; if (o.onend) o.onend(); }
    };
    const player = {
      play(at = from, until = to) {
        cancelAnimationFrame(raf);
        stop = until; now = calm ? stop : at; ended = false;
        last = performance.now();
        raf = requestAnimationFrame(tick);
        return player;
      },
      pause() { cancelAnimationFrame(raf); raf = 0; return player; },
      seek(t) { player.pause(); now = t; paint(); return player; },
      finish() { player.pause(); now = stop; paint(); if (!ended) { ended = true; if (o.onend) o.onend(); } return player; },
      paint,
    };
    if (typeof ResizeObserver === 'function') new ResizeObserver(paint).observe(canvas);
    paint();
    return o.autoplay === false ? player : player.play();
  };

  // ── Files ──────────────────────────────────────────────────────────────
  const frameBox = (aspect) => {
    const h = SCENE.view, w = h * aspect;
    return `${num(-w / 2)} ${num(-h / 2)} ${num(w)} ${num(h)}`;
  };
  const paint = (look) => `--ground:${look.bg};--ring:${look.ring};--star:${look.star};--mint:${look.flavors[0]};--yellow:${look.flavors[1]};--red:${look.flavors[2]}`;
  const NAMES = ['mint', 'yellow', 'red'];
  const flavorOf = (color, look) => NAMES[look.flavors.indexOf(color)];
  const SPHERE = `<radialGradient id="sphere" cx=".5" cy=".5" r=".5" fx=".42" fy=".4">${SHADE.map(([at, c]) => { const m = c.match(/[\d.]+/g); return `<stop offset="${at}" stop-color="rgb(${m[0]},${m[1]},${m[2]})" stop-opacity="${m[3]}"/>`; }).join('')}</radialGradient>`;

  // One moment of the film as a plain SVG, for opening in a design tool.
  const still = (t, o = {}) => {
    const look = THEMES[o.theme || 'space'], f = frame(t, { ...o, grade: false, detail: { cell: .22, tol: .008 } });
    const ground = o.clear ? '' : `<rect id="space" x="-2000" y="-2000" width="4000" height="4000" fill="${f.bg}"/>`;
    const stars = f.stars.map((s, i) => `<path id="stars-${i}" d="${s.d}" stroke="${s.color}" stroke-width="${s.width}" stroke-opacity="${num(s.alpha)}" stroke-linecap="round" fill="none"/>`).join('');
    const rings = f.rings.map((r) => `<circle cx="${num(r.x)}" cy="${num(r.y)}" r="${num(r.r)}" stroke="${r.color}" stroke-width="${num(r.width)}" stroke-opacity="${num(r.alpha)}" fill="none"/>`).join('');
    const strips = f.tails;
    const fades = strips.map((c, i) => `<linearGradient id="tail${i}" gradientUnits="userSpaceOnUse" x1="${num(c.x1)}" y1="${num(c.y1)}" x2="${num(c.x2)}" y2="${num(c.y2)}"><stop offset="0" stop-color="${c.color}" stop-opacity="${num(c.start)}"/><stop offset="1" stop-color="${c.color}" stop-opacity="${num(c.end)}"/></linearGradient>`).join('');
    const tails = strips.map((c, i) => `<path d="${c.d}" fill="url(#tail${i})"/>`).join('');
    const cells = f.cells.map((c) => `<path id="flavor-${flavorOf(c.color, look)}" d="${c.d}" fill="${c.color}" stroke="${c.color}" stroke-width=".35"/>`).join('');
    const placedRound = (l, fill) => `<circle r="1" transform="matrix(${[l.cos * l.rx, l.sin * l.rx, -l.sin * l.ry, l.cos * l.ry, l.x, l.y].map(num).join(' ')})" fill="${fill}" opacity="${num(l.alpha)}"/>`;
    const lights = f.shades.map((l) => placedRound(l, '#000')).join('') + f.lights.map((l) => placedRound(l, 'url(#sphere)')).join('');
    const placed = (l, fill) => `<path fill="${fill}" transform="translate(${num(l.x)} ${num(l.y)}) scale(${num(l.sx)} ${num(l.sy)}) translate(${num(l.shift)} 0)" d="${l.d}"/>`;
    const d = f.word && f.word.drop;
    const word = !f.word ? '' : `<g id="name">${f.word.letters.filter((l) => l.sy).map((l) => placed(l, f.word.color)).join('')}${d ? placed({ ...d, sx: d.size, sy: d.size }, d.color) : ''}</g>`;
    const threads = f.threads.map((t) => `<path d="${t.d}" fill="${t.color}"/>`).join('');
    const blend = !f.mix ? '' : `<g id="mixing" fill="none" stroke="${f.mix.color}" stroke-opacity="${num(.26 * f.mix.alpha)}" stroke-linecap="round" stroke-linejoin="round">${Array.from({ length: MIXING }, (_, i) => `<path d="${f.mix.d}" stroke-width="${num(f.mix.width * (MIXING - i) / MIXING)}"/>`).join('')}</g>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${frameBox(o.aspect || 16 / 9)}"><title>Neutrino oscillation at ${t}s</title><defs>${SPHERE}${fades}</defs>${ground}<g id="stars">${stars}</g><g id="planet">${rings}</g><g id="tails">${tails}</g><clipPath id="mass"><path d="${f.mass}"/></clipPath><g id="beads" clip-path="url(#mass)">${cells}${blend}${lights}</g><g id="threads">${threads}</g>${word}</svg>`;
  };

  // The mark itself, drawn the way a person would, in the order of mac/icon.swift: tile, planet,
  // tails, heads. With name: true, the lockup: the mark and the name side by side.
  const mark = (o = {}) => {
    const look = THEMES[o.theme || 'dark'], heading = (o.heading ?? SCENE.heading) * PI / 180;
    const at = (s, n) => [s * cos(heading) + n * sin(heading), -s * sin(heading) + n * cos(heading)].map(num);
    const box = 67.5, tile = o.tile ? `<rect id="tile" x="${-box}" y="${-box}" width="135" height="135" rx="30.47" fill="${look.bg}"/><rect id="rim" x="${-box + .25}" y="${-box + .25}" width="134.5" height="134.5" rx="30.22" fill="none" stroke="${o.theme === 'light' ? '#000' : '#fff'}" stroke-opacity=".1" stroke-width=".98"/>` : '';
    const planet = `<circle id="planet" r="${MARK.ring}" fill="none" stroke="${look.ring}" stroke-width="${MARK.ringWidth}"/>`;
    const streaks = MARK.streaks.map((st, c) => {
      const color = look.flavors[c];
      const tail = MARK.tail.map(({ from, to, alpha }) => {
        const [x1, y1] = at(st.s - to, st.n), [x2, y2] = at(st.s - from, st.n);
        return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}"${alpha < 1 ? ` stroke-opacity="${alpha}"` : ''}/>`;
      }).join('');
      const [hx, hy] = at(st.s, st.n);
      return `<g id="${NAMES[c]}">${tail}<circle cx="${hx}" cy="${hy}" r="${MARK.head}" fill="${color}"/></g>`;
    }).join('');
    const drawn = `${tile}${planet}<g id="neutrinos" stroke-width="${MARK.tailWidth}" stroke-linecap="round">${streaks}</g>`;
    if (!o.name) {
      const size = o.tile ? box : 70;
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-size} ${-size} ${size * 2} ${size * 2}"><title>Neutrino</title>${drawn}</svg>`;
    }
    const r = rig({ heading: o.heading }), { mark: m } = SCENE.lockup, baseline = r.size * 15;
    let pen = r.word, dotAt = 0;
    const letters = GLYPHS.map((g, i) => { const x = pen; if (i === DOT.glyph) dotAt = x; pen += g.width * r.size; return `<path transform="translate(${num(x)} ${num(baseline)}) scale(${num(r.size)})" d="${g.d}"/>`; }).join('');
    const name = `<g id="name" fill="${look.ring}">${letters}</g><path id="dot" fill="${look.ring}" transform="translate(${num(dotAt)} ${num(baseline)}) scale(${num(r.size)})" d="${DOT.d}"/>`;
    const w = 320, h = 124;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-w / 2} ${-h / 2} ${w} ${h}"><title>Neutrino</title><g transform="translate(${num(r.shift)} 0) scale(${m})">${drawn}</g>${name}</svg>`;
  };

  // The whole film as one self-playing SVG: no script, so it runs from an <img> and scales like
  // any vector. Every shape holds the last frame as its plain value, so a tool that doesn't
  // animate shows the finished lockup. Colours are custom properties at the top of the file.
  const bake = (o = {}) => {
    const look = THEMES[o.theme || 'space'], fps = o.fps || SCENE.fps, total = round(T * fps) + 1, aspect = o.aspect || 16 / 9;
    const frames = [];
    for (let i = 0; i < total; i++) frames.push(frame(i / fps, { ...o, grade: false, detail: { cell: .55, tol: .035, tail: .3 }, cull: [SCENE.view * aspect / 2 + 6, SCENE.view / 2 + 6] }));

    // Holds each value until it changes, so a still stretch costs nothing.
    const when = (i) => String(+(i / (total - 1)).toFixed(5));   // a frame is .4% of the film: keep the precision
    const held = (values) => {
      const keep = [], times = [];
      values.forEach((v, i) => { if (v !== keep[keep.length - 1]) { keep.push(v); times.push(when(i)); } });
      return [keep, times];
    };
    const timing = `dur="${T}s" fill="freeze" calcMode="discrete"`;
    const track = (attr, values) => {
      const [keep, times] = held(values);
      return keep.length < 2 ? '' : `<animate attributeName="${attr}" ${timing} keyTimes="${times.join(';')}" values="${keep.join(';')}"/>`;
    };
    const moving = (type, values) => {
      const [keep, times] = held(values);
      return keep.length < 2 ? '' : `<animateTransform attributeName="transform" type="${type}" ${timing} keyTimes="${times.join(';')}" values="${keep.join(';')}"/>`;
    };
    const lastOf = (values) => values[values.length - 1];

    // Nine strips, one for each piece of each tail. The neon stays with the tube: the clean master doesn't need it.
    const strips = [0, 1, 2].flatMap((j) => [0, 1, 2].map((piece) => {
      const key = `${j}${piece}`, id = `tail${key}`, hits = frames.map((f) => f.tails.find((c) => c.key === key));
      const of = (pick, none) => hits.map((c) => (c ? pick(c) : none));
      const d = of((c) => c.d, 'M0 0'), colour = of((c) => c.color, look.flavors[0]);
      const ends = ['x1', 'y1', 'x2', 'y2'].map((k) => [k, of((c) => num(c[k]), '0')]);
      const stop = (at, pick) => { const o = of((c) => num(pick(c)), '0'); return `<stop offset="${at}" stop-color="${lastOf(colour)}" stop-opacity="${lastOf(o)}">${track('stop-color', colour)}${track('stop-opacity', o)}</stop>`; };
      return {
        fade: `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" ${ends.map(([k, v]) => `${k}="${lastOf(v)}"`).join(' ')}>${ends.map(([k, v]) => track(k, v)).join('')}${stop(0, (c) => c.start)}${stop(1, (c) => c.end)}</linearGradient>`,
        shape: `<path fill="url(#${id})" d="${lastOf(d)}">${track('d', d)}</path>`,
      };
    }));

    const massValues = frames.map((f) => f.mass || 'M0 0');
    const cells = [0, 1, 2].map((c) => {
      const values = frames.map((f) => f.cells[c].d);
      return `<path class="${NAMES[c]}" d="${lastOf(values)}">${track('d', values)}</path>`;
    }).join('');
    // SMIL can't animate a matrix, so a light is a turn inside a stretch inside a move.
    const lights = [['shades', 0, '#000'], ['shades', 1, '#000'], ['shades', 2, '#000'], ['lights', 0], ['lights', 1], ['lights', 2]].map(([list, i, fill]) => {
      const of = (pick) => frames.map((f) => (f[list][i] ? pick(f[list][i]) : null));
      const at = of((l) => `${num(l.x)} ${num(l.y)}`).map((v) => v || '0 0');
      const turn = of((l) => num(atan2(l.sin, l.cos) * 180 / PI)).map((v) => v || '0');
      const size = of((l) => `${num(l.rx)} ${num(l.ry)}`).map((v) => v || '0 0');
      const glow = of((l) => num(l.alpha)).map((v) => v || '0');
      return `<g transform="translate(0)">${moving('translate', at)}<g transform="rotate(0)">${moving('rotate', turn)}<g transform="scale(0)">${moving('scale', size)}<circle r="1" fill="${fill || 'url(#sphere)'}" opacity="0">${track('opacity', glow)}</circle></g></g></g>`;
    }).join('');

    const ring = (i, cls) => {
      const of = (pick) => frames.map((f) => (f.rings[i] ? num(pick(f.rings[i])) : '0'));
      const x = of((v) => v.x), y = of((v) => v.y), r = of((v) => v.r), w = of((v) => v.width), a = of((v) => v.alpha);
      return `<circle class="${cls}" cx="${lastOf(x)}" cy="${lastOf(y)}" r="${lastOf(r)}" stroke-width="${lastOf(w)}" opacity="${lastOf(a)}">${track('cx', x)}${track('cy', y)}${track('r', r)}${track('stroke-width', w)}${track('opacity', a)}</circle>`;
    };

    const stars = o.stars === false ? '' : LAYERS.map((l, i) => {
      const d = frames.map((f) => f.stars[i].d), a = frames.map((f) => num(f.stars[i].alpha));
      return `<path class="star" d="${lastOf(d)}" stroke-width="${l.width}" opacity="${lastOf(a)}">${track('d', d)}${track('opacity', a)}</path>`;
    }).join('');

    let name = '';
    if (o.wordmark !== false) {
      const letters = GLYPHS.map((g, i) => {
        const at = frames.map((f) => { const l = f.word.letters[i]; return `${num(l.x)} ${num(l.y)}`; });
        const size = frames.map((f) => { const l = f.word.letters[i]; return `${num(l.sx)} ${num(l.sy)}`; });
        const shift = num(frames[0].word.letters[i].shift);
        return `<g transform="translate(${lastOf(at)})">${moving('translate', at)}<g transform="scale(${lastOf(size)})">${moving('scale', size)}<path transform="translate(${shift} 0)" d="${g.d}"/></g></g>`;
      }).join('');
      const at = frames.map((f) => (f.word.drop ? `${num(f.word.drop.x)} ${num(f.word.drop.y)}` : '0 -400')), last = lastOf(frames).word;
      name = `<g id="name" class="name">${letters}</g><g transform="translate(${lastOf(at)})">${moving('translate', at)}<path class="dot" transform="scale(${num(last.drop.size)}) translate(${num(last.drop.shift)} 0)" d="${DOT.d}"/></g>`;
    }

    const band = frames.map((f) => (f.mix ? f.mix.d : 'M0 0')), bandColor = frames.map((f) => (f.mix ? f.mix.color : look.flavors[0]));
    const bandGlow = frames.map((f) => (f.mix ? num(.26 * f.mix.alpha) : '0'));
    const blending = `<defs><path id="band" d="M0 0">${track('d', band)}</path></defs><g fill="none" stroke-linecap="round" stroke-linejoin="round" stroke="${look.flavors[0]}" stroke-opacity="0">${track('stroke', bandColor)}${track('stroke-opacity', bandGlow)}${Array.from({ length: MIXING }, (_, i) => `<use href="#band" stroke-width="0">${track('stroke-width', frames.map((f) => (f.mix ? num(f.mix.width * (MIXING - i) / MIXING) : '0')))}</use>`).join('')}</g>`;

    // Six halves of thread, two a touch, each there only for its moment.
    const strands = SCENE.touches.flatMap((c) => [c.a, c.b].map((j) => {
      const key = `${c.a}${c.b}${j}`, d = frames.map((f) => (f.threads.find((t) => t.key === key) || { d: 'M0 0' }).d);
      return `<path class="${NAMES[j]}" style="stroke:none" d="M0 0">${track('d', d)}</path>`;
    })).join('');

    const css = `svg{${paint(look)}}.ground{fill:var(--ground)}.mint{fill:var(--mint);stroke:var(--mint)}.yellow{fill:var(--yellow);stroke:var(--yellow)}.red{fill:var(--red);stroke:var(--red)}.mint,.yellow,.red{stroke-width:.35}`
      + '.star,.planet,.echo{stroke:var(--ring);fill:none}.star{stroke:var(--star);stroke-linecap:round}'
      + '.name,.dot{fill:var(--ring)}';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${frameBox(aspect)}"><title>Neutrino oscillation</title><defs>${SPHERE}${strips.map((c) => c.fade).join('')}</defs><style>${css}</style>`
      + (o.clear ? '' : '<rect class="ground" x="-2000" y="-2000" width="4000" height="4000"/>')
      + `<g id="stars">${stars}</g><g id="planet">${ring(0, 'echo')}${ring(1, 'planet')}</g><g id="tails">${strips.map((c) => c.shape).join('')}</g>`
      + `<clipPath id="mass"><path d="${lastOf(massValues)}">${track('d', massValues)}</path></clipPath><g id="beads" clip-path="url(#mass)">${cells}${blending}${lights}</g><g id="threads">${strands}</g>${name}</svg>`;
  };

  return { SCENE, MARK, THEMES, CUTS, frame, draw, fit, surface, mount, still, mark, bake };
})();

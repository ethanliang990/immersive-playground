const canvas = document.querySelector("#field");
const context = canvas.getContext("2d", { alpha: false });
const modeButtons = [...document.querySelectorAll("[data-mode]")];
const pauseButton = document.querySelector('[data-action="pause"]');
const remixButton = document.querySelector('[data-action="remix"]');
const energySlider = document.querySelector("#energy");
const densitySlider = document.querySelector("#density");
const energyOutput = document.querySelector("#energy-output");
const densityOutput = document.querySelector("#density-output");
const modeStatus = document.querySelector("#mode-status");
const readout = document.querySelector("#readout");
const announcer = document.querySelector("#announcer");

const field = {
  width: 0,
  height: 0,
  dpr: Math.min(window.devicePixelRatio || 1, 2),
  particles: [],
  ripples: [],
  pointer: { x: -9999, y: -9999, active: false },
  mode: "drift",
  energy: 72,
  density: 150,
  paused: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  lastTime: 0,
  hueOffset: 0,
};

const palette = {
  drift: [101, 240, 255],
  pulse: [255, 104, 201],
  lattice: [217, 255, 91],
};

function random(min, max) {
  return min + Math.random() * (max - min);
}

function fitCanvas() {
  field.width = window.innerWidth;
  field.height = window.innerHeight;
  canvas.width = Math.round(field.width * field.dpr);
  canvas.height = Math.round(field.height * field.dpr);
  context.setTransform(field.dpr, 0, 0, field.dpr, 0, 0);
  createParticles();
}

function createParticles() {
  field.particles = Array.from({ length: field.density }, () => ({
    x: random(0, field.width),
    y: random(0, field.height),
    baseX: random(0, field.width),
    baseY: random(0, field.height),
    vx: random(-0.35, 0.35),
    vy: random(-0.35, 0.35),
    size: random(0.8, 2.7),
    phase: random(0, Math.PI * 2),
  }));
}

function setMode(mode) {
  field.mode = mode;
  modeStatus.textContent = mode.toUpperCase();
  modeButtons.forEach((button) => {
    const active = button.dataset.mode === mode;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  readout.textContent = `${mode.toUpperCase()} mode armed.`;
  announcer.textContent = `${mode} mode selected.`;
}

function setPaused(nextState) {
  field.paused = nextState;
  pauseButton.textContent = nextState ? "Resume motion" : "Pause motion";
  pauseButton.setAttribute("aria-pressed", String(nextState));
  readout.textContent = nextState ? "Motion paused. Press space to resume." : "Motion resumed.";
  announcer.textContent = nextState ? "Motion paused." : "Motion resumed.";
}

function remix() {
  field.hueOffset = Math.floor(Math.random() * 90) - 45;
  createParticles();
  field.ripples = [];
  sendRipple(field.width * random(0.25, 0.75), field.height * random(0.25, 0.75), 1.35);
  readout.textContent = "New field generated.";
  announcer.textContent = "New field generated.";
}

function sendRipple(x, y, strength = 1) {
  field.ripples.push({ x, y, radius: 4, opacity: 1, strength });
  if (field.ripples.length > 6) field.ripples.shift();
}

function updateParticle(particle, time, delta) {
  const energy = field.energy / 100;
  const modeMultiplier = field.mode === "pulse" ? 1.45 : field.mode === "lattice" ? 0.62 : 1;
  const waveX = Math.sin(time * 0.00055 + particle.phase + particle.y * 0.008) * 0.13;
  const waveY = Math.cos(time * 0.00043 + particle.phase + particle.x * 0.006) * 0.13;

  particle.vx += waveX * energy * modeMultiplier;
  particle.vy += waveY * energy * modeMultiplier;

  if (field.mode === "lattice") {
    particle.vx += (particle.baseX - particle.x) * 0.00016;
    particle.vy += (particle.baseY - particle.y) * 0.00016;
  }

  if (field.pointer.active) {
    const dx = particle.x - field.pointer.x;
    const dy = particle.y - field.pointer.y;
    const distance = Math.max(32, Math.hypot(dx, dy));
    const reach = 310 * energy;
    if (distance < reach) {
      const force = (1 - distance / reach) * 0.45 * energy;
      const sign = field.mode === "pulse" ? 1 : -1;
      particle.vx += (dx / distance) * force * sign;
      particle.vy += (dy / distance) * force * sign;
    }
  }

  for (const ripple of field.ripples) {
    const dx = particle.x - ripple.x;
    const dy = particle.y - ripple.y;
    const distance = Math.hypot(dx, dy);
    const band = Math.abs(distance - ripple.radius);
    if (band < 28) {
      const force = (1 - band / 28) * 0.8 * ripple.strength;
      particle.vx += (dx / (distance || 1)) * force;
      particle.vy += (dy / (distance || 1)) * force;
    }
  }

  particle.vx *= 0.967;
  particle.vy *= 0.967;
  particle.x += particle.vx * delta;
  particle.y += particle.vy * delta;

  if (particle.x < -30) particle.x = field.width + 30;
  if (particle.x > field.width + 30) particle.x = -30;
  if (particle.y < -30) particle.y = field.height + 30;
  if (particle.y > field.height + 30) particle.y = -30;
}

function drawBackdrop(time) {
  const gradient = context.createRadialGradient(
    field.pointer.active ? field.pointer.x : field.width * 0.58,
    field.pointer.active ? field.pointer.y : field.height * 0.35,
    0,
    field.width * 0.55,
    field.height * 0.4,
    Math.max(field.width, field.height) * 0.78,
  );
  const [red, green, blue] = palette[field.mode];
  gradient.addColorStop(0, `rgba(${red}, ${green}, ${blue}, 0.14)`);
  gradient.addColorStop(0.45, "rgba(10, 20, 51, 0.55)");
  gradient.addColorStop(1, "#050713");
  context.fillStyle = gradient;
  context.fillRect(0, 0, field.width, field.height);

  if (field.mode === "lattice") {
    context.strokeStyle = "rgba(217, 255, 91, 0.06)";
    context.lineWidth = 1;
    const spacing = 42;
    for (let x = -spacing; x < field.width + spacing; x += spacing) {
      context.beginPath();
      context.moveTo(x + Math.sin(time * 0.0004 + x) * 6, 0);
      context.lineTo(x, field.height);
      context.stroke();
    }
  }
}

function drawConnections() {
  const maxDistance = field.mode === "pulse" ? 112 : 92;
  const step = field.density > 180 ? 2 : 1;
  const [red, green, blue] = palette[field.mode];
  context.lineWidth = 0.55;
  for (let i = 0; i < field.particles.length; i += step) {
    const a = field.particles[i];
    for (let j = i + step; j < field.particles.length; j += step) {
      const b = field.particles[j];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      if (distance < maxDistance) {
        const alpha = (1 - distance / maxDistance) * 0.23;
        context.strokeStyle = `rgba(${red}, ${green}, ${blue}, ${alpha})`;
        context.beginPath();
        context.moveTo(a.x, a.y);
        context.lineTo(b.x, b.y);
        context.stroke();
      }
    }
  }
}

function drawRipples(delta) {
  const [red, green, blue] = palette[field.mode];
  field.ripples = field.ripples.filter((ripple) => ripple.opacity > 0.01);
  field.ripples.forEach((ripple) => {
    ripple.radius += 5.2 * delta * (field.energy / 55);
    ripple.opacity *= 0.972;
    context.beginPath();
    context.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
    context.strokeStyle = `rgba(${red}, ${green}, ${blue}, ${ripple.opacity * 0.45})`;
    context.lineWidth = Math.max(0.5, ripple.opacity * 2);
    context.stroke();
  });
}

function drawParticles() {
  const [red, green, blue] = palette[field.mode];
  for (const particle of field.particles) {
    context.beginPath();
    context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    context.fillStyle = `rgba(${red}, ${green}, ${blue}, 0.78)`;
    context.fill();
  }
}

function frame(time) {
  const delta = Math.min(2, (time - field.lastTime) / 16.67 || 1);
  field.lastTime = time;
  drawBackdrop(time);

  if (!field.paused) {
    field.particles.forEach((particle) => updateParticle(particle, time, delta));
    drawRipples(delta);
  } else {
    drawRipples(0.18);
  }
  drawConnections();
  drawParticles();
  requestAnimationFrame(frame);
}

function movePointer(event) {
  const rect = canvas.getBoundingClientRect();
  field.pointer.x = event.clientX - rect.left;
  field.pointer.y = event.clientY - rect.top;
  field.pointer.active = true;
  readout.textContent = `Signal at ${Math.round(field.pointer.x)}, ${Math.round(field.pointer.y)}.`;
}

canvas.addEventListener("pointermove", movePointer);
canvas.addEventListener("pointerdown", (event) => {
  movePointer(event);
  sendRipple(field.pointer.x, field.pointer.y);
  if (field.paused) setPaused(false);
});
canvas.addEventListener("pointerleave", () => { field.pointer.active = false; });

modeButtons.forEach((button) => button.addEventListener("click", () => setMode(button.dataset.mode)));
pauseButton.addEventListener("click", () => setPaused(!field.paused));
remixButton.addEventListener("click", remix);
energySlider.addEventListener("input", () => {
  field.energy = Number(energySlider.value);
  energyOutput.textContent = field.energy;
});
densitySlider.addEventListener("input", () => {
  field.density = Number(densitySlider.value);
  densityOutput.textContent = field.density;
  createParticles();
});

window.addEventListener("keydown", (event) => {
  if (event.target.matches("input")) return;
  if (["1", "2", "3"].includes(event.key)) setMode(["drift", "pulse", "lattice"][Number(event.key) - 1]);
  if (event.key.toLowerCase() === "r") remix();
  if (event.code === "Space") { event.preventDefault(); setPaused(!field.paused); }
});
window.addEventListener("resize", fitCanvas);

fitCanvas();
setPaused(field.paused);
requestAnimationFrame(frame);

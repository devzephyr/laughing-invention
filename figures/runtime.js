// Shared live runtime, inlined into every figure page after the kit.
// A figure is a pure function of cycle time t and one boolean: the bug (false) or the fix (true).
// This drives the idle tour (alternating bug and fix), hover scrubbing, arrow-key steps,
// the fix toggle, the offscreen pause and reduced motion, and writes the readout.
function runFigure({ cycle, scrubEnd, steps, draw, phase, label }) {
  const stage = document.querySelector(".iso-stage");
  const svg = stage.querySelector("svg");
  const readout = document.querySelector("[data-readout]");
  const live = document.querySelector("[data-live]");
  const button = document.querySelector("[data-fix]");
  const still = matchMedia("(prefers-reduced-motion: reduce)");
  const settledAt = steps[steps.length - 1];

  let fixed = false,
    t = 0,
    goal = 0,
    touring = !still.matches,
    visible = false,
    frame = 0,
    last = 0,
    idle = 0,
    said = "";
  if (still.matches) t = goal = settledAt;

  const say = (text, announce) => {
    if (readout.textContent !== text) readout.textContent = text;
    if (announce && live.textContent !== text) live.textContent = text;
  };
  const sync = () => {
    button.setAttribute("aria-pressed", String(fixed));
    button.textContent = label(fixed);
  };
  const render = () => {
    draw(t, fixed);
    const text = phase(t, fixed);
    if (text !== said) {
      said = text;
      say(text, !touring);
    }
  };

  function tick(now) {
    const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
    last = now;
    if (touring) {
      goal += dt;
      if (goal >= cycle) {
        goal -= cycle;
        fixed = !fixed;
        sync();
      }
      t = goal;
    } else {
      t = still.matches ? goal : t + (goal - t) * (1 - Math.exp(-dt / 0.25));
      if (Math.abs(goal - t) < 0.002) t = goal;
    }
    render();
    frame =
      visible && (touring || t !== goal) ? requestAnimationFrame(tick) : 0;
  }
  const run = () => {
    if (!frame && visible) {
      last = 0;
      frame = requestAnimationFrame(tick);
    }
  };

  // Any input stops the tour where it is; it resumes 3.6 s after the last one
  function takeOver() {
    touring = false;
    clearTimeout(idle);
    if (!still.matches)
      idle = setTimeout(() => {
        touring = true;
        goal = t;
        run();
      }, 3600);
  }

  button.addEventListener("click", () => {
    fixed = !fixed;
    sync();
    clearTimeout(idle);
    // Replay from the start so the reader watches the whole run in the new mode
    if (still.matches) {
      t = goal = settledAt;
      render();
      return;
    }
    touring = true;
    t = goal = 0;
    render();
    run();
  });

  stage.addEventListener("pointermove", (event) => {
    if (event.pointerType !== "mouse") return;
    const box = svg.getBoundingClientRect();
    const share = Math.min(
      1,
      Math.max(0, ((event.clientX - box.left) / box.width - 0.12) / 0.76),
    );
    takeOver();
    goal = share * scrubEnd;
    run();
  });

  stage.addEventListener("keydown", (event) => {
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      button.click();
      return;
    }
    const here = steps.reduce(
      (best, s, i) =>
        Math.abs(s - goal) < Math.abs(steps[best] - goal) ? i : best,
      0,
    );
    let next = null;
    if (event.key === "ArrowRight" || event.key === "ArrowUp")
      next = steps[Math.min(steps.length - 1, here + 1)];
    if (event.key === "ArrowLeft" || event.key === "ArrowDown")
      next = steps[Math.max(0, here - 1)];
    if (event.key === "Home") next = steps[0];
    if (event.key === "End") next = settledAt;
    if (next === null) return;
    event.preventDefault();
    takeOver();
    goal = next;
    run();
  });
  stage.addEventListener("focus", () => say(said, true));

  new IntersectionObserver(
    (entries) => {
      visible = entries[entries.length - 1].isIntersecting;
      if (visible) run();
    },
    { rootMargin: "120px 0px" },
  ).observe(stage);
  still.addEventListener("change", () => {
    touring = !still.matches;
    if (still.matches) t = goal = settledAt;
    render();
    run();
  });
  sync();
  render();
}

// Smoothstep from a to b; the easing every figure uses for scripted moves
function ease(a, b, x) {
  const u = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return u * u * (3 - 2 * u);
}

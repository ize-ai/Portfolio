// Tells the CSS that JavaScript is running (reveal animations depend on it)
document.documentElement.classList.add("js");

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;   // visitor asked for less motion
const hasMouse = matchMedia("(hover: hover) and (pointer: fine)").matches;

/* ==========================================================
   1. ROTATING WORD IN THE HEADLINE
   ========================================================== */
const words = $$(".words span");

if (words.length && !calm) {
  let current = 0;
  setInterval(() => {
    words[current].classList.remove("on");
    current = (current + 1) % words.length;   // wraps back to the first word
    words[current].classList.add("on");
  }, 2400);
}

/* ==========================================================
   2. RIBBONS: duplicate the text so the marquee loops with no gap
   ========================================================== */
$$(".track").forEach((track) => {
  track.innerHTML += track.innerHTML;
});

/* ==========================================================
   3. SCROLL REVEAL (items in the same group arrive one by one)
   ========================================================== */
const revealEls = $$(".reveal");

revealEls.forEach((el) => {
  const group = [...el.parentElement.children].filter((c) => c.classList.contains("reveal"));
  el.style.transitionDelay = `${Math.min(group.indexOf(el), 3) * 0.12}s`;
});

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);   // animate once, then stop watching
      });
    },
    { threshold: 0.15 }
  );
  revealEls.forEach((el) => revealObserver.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add("is-visible"));
}

/* ==========================================================
   4. DOCK: highlight the link for the section you're in
   ========================================================== */
const dockLinks = $$(".dock a");

if ("IntersectionObserver" in window) {
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        dockLinks.forEach((link) => {
          const isCurrent = link.getAttribute("href") === `#${entry.target.id}`;
          if (isCurrent) link.setAttribute("aria-current", "true");
          else link.removeAttribute("aria-current");
        });
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }   // a thin band across the middle of the screen
  );
  $$("main section[id]").forEach((section) => sectionObserver.observe(section));
}

/* ==========================================================
   5. BADGE: spins faster as you scroll
   ========================================================== */
const badge = $(".badge");

if (badge && !calm) {
  addEventListener(
    "scroll",
    () => badge.style.setProperty("--spin", `${scrollY * 0.3}deg`),
    { passive: true }
  );
}

/* ==========================================================
   6. CURSOR GLOW + HERO PARALLAX (only with a real mouse)
   ========================================================== */
if (hasMouse && !calm) {
  const glow = $(".cursor-glow");
  const hero = $(".hero");
  let targetX = 0, targetY = 0, x = 0, y = 0;

  addEventListener("pointermove", (event) => {
    targetX = event.clientX;
    targetY = event.clientY;
    glow.classList.add("on");
    // -0.5 to +0.5 across the screen, used by the CSS to nudge the blobs
    hero.style.setProperty("--px", (event.clientX / innerWidth - 0.5).toFixed(3));
    hero.style.setProperty("--py", (event.clientY / innerHeight - 0.5).toFixed(3));
  });

  // The glow chases the cursor a little behind it, which feels soft and dreamy
  (function follow() {
    x += (targetX - x) * 0.12;
    y += (targetY - y) * 0.12;
    glow.style.setProperty("--cx", `${x}px`);
    glow.style.setProperty("--cy", `${y}px`);
    requestAnimationFrame(follow);
  })();
}

/* ==========================================================
   7. DRAGGABLE STICKERS (double-click to put one back)
   ========================================================== */
$$(".sticker").forEach((sticker) => {
  let startX = 0, startY = 0, offsetX = 0, offsetY = 0;

  sticker.addEventListener("pointerdown", (event) => {
    sticker.setPointerCapture(event.pointerId);   // keep receiving moves even if the pointer leaves
    sticker.classList.add("drag");
    startX = event.clientX - offsetX;
    startY = event.clientY - offsetY;
  });

  sticker.addEventListener("pointermove", (event) => {
    if (!sticker.classList.contains("drag")) return;
    offsetX = event.clientX - startX;
    offsetY = event.clientY - startY;
    sticker.style.setProperty("--x", `${offsetX}px`);
    sticker.style.setProperty("--y", `${offsetY}px`);
  });

  const drop = () => sticker.classList.remove("drag");
  sticker.addEventListener("pointerup", drop);
  sticker.addEventListener("pointercancel", drop);

  sticker.addEventListener("dblclick", () => {
    offsetX = offsetY = 0;
    sticker.style.setProperty("--x", "0px");
    sticker.style.setProperty("--y", "0px");
  });
});

/* ==========================================================
   8. CONTACT FORM: send without leaving the page (Netlify Forms)
   ========================================================== */
const form = $(".form");
const status = $(".form-status");

if (form && status) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    status.textContent = "Sending…";

    try {
      const response = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(new FormData(form)).toString(),
      });
      if (!response.ok) throw new Error("Request failed");

      form.reset();
      status.textContent = "Thanks! Your message is on its way. I’ll reply as soon as I can.";
    } catch (error) {
      status.textContent = "Something went wrong. Please email me directly at isiakaaishah@gmail.com.";
    }
  });
}
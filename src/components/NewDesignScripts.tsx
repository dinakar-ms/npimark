"use client";

import { useEffect } from "react";

export function NewDesignScripts() {
  useEffect(() => {
    // Reveal on scroll
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add("shown");
          e.target.querySelectorAll(".bars").forEach((b) => b.classList.add("in"));
          io.unobserve(e.target);
        });
      },
      { threshold: 0.12 },
    );
    document.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));

    // Count-up numbers
    const fmt = (n: number) => n.toLocaleString("en-US");
    const counter = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const el = e.target as HTMLElement;
          const end = +(el.dataset.count ?? "0");
          const t0 = performance.now();
          const dur = 1400;
          const step = (t: number) => {
            const p = Math.min(1, (t - t0) / dur);
            el.textContent = fmt(Math.round(end * (1 - Math.pow(1 - p, 3))));
            if (p < 1) requestAnimationFrame(step);
          };
          if (!matchMedia("(prefers-reduced-motion: reduce)").matches) requestAnimationFrame(step);
          counter.unobserve(el);
        }),
      { threshold: 0.4 },
    );
    document.querySelectorAll("[data-count]").forEach((el) => counter.observe(el));

    // Record cadence filter
    const chips = document.querySelectorAll<HTMLButtonElement>(".cad-chip");
    const fields = document.querySelector(".rec-fields");
    chips.forEach((c) =>
      c.addEventListener("click", () => {
        chips.forEach((x) => x.setAttribute("aria-pressed", String(x === c)));
        const cad = c.dataset.cad;
        fields?.classList.toggle("filtered", cad !== "all");
        fields?.querySelectorAll<HTMLElement>(".rf").forEach((r) => r.classList.toggle("match", r.dataset.cad === cad));
      }),
    );

    // Export picker: single selection per list
    document.querySelectorAll(".exp").forEach((exp) => {
      const cols = exp.querySelectorAll('[data-pick="cols"] li');
      const fmts = exp.querySelectorAll('[data-pick="fmt"] li');
      [cols, fmts].forEach((set) =>
        set.forEach((li) =>
          li.addEventListener("click", () => {
            set.forEach((x) => x.removeAttribute("aria-current"));
            li.setAttribute("aria-current", "true");
          }),
        ),
      );
    });

    return () => {
      io.disconnect();
      counter.disconnect();
    };
  }, []);

  return null;
}

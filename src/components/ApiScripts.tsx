"use client";

import { useEffect } from "react";

export function ApiScripts() {
  useEffect(() => {
    document.querySelectorAll<HTMLButtonElement>(".copy-btn").forEach((b) =>
      b.addEventListener("click", async () => {
        const pre = b.closest(".code")?.querySelector("pre");
        if (!pre) return;
        try {
          await navigator.clipboard.writeText(pre.innerText);
        } catch {}
        b.classList.add("done");
        b.innerHTML = '<i class="ph ph-check"></i>Copied';
        setTimeout(() => {
          b.classList.remove("done");
          b.innerHTML = '<i class="ph ph-copy"></i>Copy';
        }, 1600);
      }),
    );

    const q = document.getElementById("ep-q") as HTMLInputElement | null;
    if (q)
      q.addEventListener("input", () => {
        const v = q.value.trim().toLowerCase();
        document.querySelectorAll<HTMLTableRowElement>(".ep-table tbody tr").forEach((r) => {
          r.hidden = !!v && !(r.dataset.k ?? "").includes(v);
        });
      });

    const links = [...document.querySelectorAll<HTMLAnchorElement>(".api-toc nav a")];
    const secs = links.map((a) => document.querySelector(a.getAttribute("href")!));
    const spy = () => {
      let cur = 0;
      secs.forEach((s, i) => {
        if (s && s.getBoundingClientRect().top < 140) cur = i;
      });
      links.forEach((a, i) => a.classList.toggle("on", i === cur));
    };
    window.addEventListener("scroll", spy, { passive: true });
    spy();
    return () => window.removeEventListener("scroll", spy);
  }, []);

  return null;
}

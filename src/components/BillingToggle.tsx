"use client";

import { useCallback, useState } from "react";

export function BillingToggle({ children }: { children: React.ReactNode }) {
  const [yearly, setYearly] = useState(false);

  const toggle = useCallback((y: boolean) => {
    setYearly(y);
    document.querySelectorAll<HTMLElement>("[data-m]").forEach((el) => {
      el.textContent = y ? (el.dataset.y ?? "") : (el.dataset.m ?? "");
    });
    document.querySelectorAll<HTMLElement>("[data-pm]").forEach((el) => {
      el.textContent = y ? (el.dataset.py ?? "") : (el.dataset.pm ?? "");
    });
  }, []);

  return (
    <div className="pr-plans-inner">
      <div className="plans-head">
        <div className="seg-bill" role="radiogroup" aria-label="Billing period">
          <button type="button" role="radio" aria-checked={!yearly} onClick={() => toggle(false)}>Monthly</button>
          <button type="button" role="radio" aria-checked={yearly} onClick={() => toggle(true)}>Yearly <span>2 months free</span></button>
        </div>
      </div>
      {children}
    </div>
  );
}

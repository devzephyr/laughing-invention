"use client";

const KEY = "lowPower";

export function getLowPower(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(KEY) === "1";
}

export function setLowPower(value: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, value ? "1" : "0");
  window.dispatchEvent(new CustomEvent("lowpowerchange", { detail: value }));
}


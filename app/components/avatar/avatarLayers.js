"use client";

import { useEffect, useState } from "react";

/**
 * Loads our own layer SVGs once and keeps their inner markup in memory.
 * Inline (not <img>) so `var(--c1)` / `var(--c2)` / `var(--skin)` from the
 * wrapping <g> reach the shapes.
 */
const cache = new Map(); // src → markup string
const pending = new Map(); // src → Promise<string>

/** Our files only: strip scripts/handlers, unwrap <svg>, and move var() fills into style (works in every browser). */
export function prepareLayerSvg(text) {
  const inner = text.match(/<svg[^>]*>([\s\S]*)<\/svg>/i)?.[1] ?? "";
  return inner
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\s(fill|stroke)="(var\([^"]+\))"/g, ' style="$1:$2"');
}

export function loadLayer(src) {
  if (cache.has(src)) return Promise.resolve(cache.get(src));
  if (!pending.has(src)) {
    pending.set(src, fetch(src)
      .then((response) => (response.ok ? response.text() : ""))
      .catch(() => "")
      .then((text) => {
        const markup = prepareLayerSvg(text);
        cache.set(src, markup);
        pending.delete(src);
        return markup;
      }));
  }
  return pending.get(src);
}

/** Warm the cache (e.g. every item in the customize grid). */
export const preloadLayers = (sources) => Promise.all(sources.map(loadLayer));

/** { [src]: markup } for the given sources; renders as soon as each is ready. */
export function useLayerMarkup(sources) {
  const key = sources.join("|");
  const [markup, setMarkup] = useState(() => Object.fromEntries(sources.filter((src) => cache.has(src)).map((src) => [src, cache.get(src)])));
  useEffect(() => {
    let cancelled = false;
    const list = key ? key.split("|") : [];
    if (list.every((src) => cache.has(src))) {
      setMarkup(Object.fromEntries(list.map((src) => [src, cache.get(src)])));
      return undefined;
    }
    Promise.all(list.map(loadLayer)).then((results) => {
      if (!cancelled) setMarkup(Object.fromEntries(list.map((src, index) => [src, results[index]])));
    });
    return () => { cancelled = true; };
  }, [key]);
  return markup;
}

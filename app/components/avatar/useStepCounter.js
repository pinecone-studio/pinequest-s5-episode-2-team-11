"use client";

/**
 * useStepCounter — утасны хөдөлгөөн мэдрэгчээр (accelerometer) алхам тоолно.
 * Зөвхөн апп нээлттэй үед ажиллана (вэб апп-ын хязгаар).
 * iPhone: анх удаа зөвшөөрөл асууна, мөн HTTPS хаяг шаардлагатай (Vercel дээр OK).
 *
 * status: "idle" | "running" | "denied" | "nosensor"
 */

import { useCallback, useEffect, useRef, useState } from "react";

const THRESHOLD = 1.1; // м/с² — дунджаас хэр их хэлбэлзэхэд алхам гэж үзэх вэ
const MIN_GAP_MS = 280; // хоёр алхмын хооронд хамгийн багадаа

export function useStepCounter(onStep) {
  const [status, setStatus] = useState("idle");
  const onStepRef = useRef(onStep);
  onStepRef.current = onStep;
  const st = useRef({ smooth: 9.8, base: 9.8, above: false, last: 0, gotData: false });
  const handlerRef = useRef(null);
  const timerRef = useRef(null);

  const stop = useCallback(() => {
    if (handlerRef.current) window.removeEventListener("devicemotion", handlerRef.current);
    handlerRef.current = null;
    clearTimeout(timerRef.current);
    setStatus((s) => (s === "running" ? "idle" : s));
  }, []);

  const start = useCallback(async () => {
    if (typeof window === "undefined" || !("DeviceMotionEvent" in window)) {
      setStatus("nosensor");
      return false;
    }
    const DME = window.DeviceMotionEvent;
    if (typeof DME.requestPermission === "function") {
      try {
        if ((await DME.requestPermission()) !== "granted") {
          setStatus("denied");
          return false;
        }
      } catch {
        setStatus("denied");
        return false;
      }
    }

    st.current = { smooth: 9.8, base: 9.8, above: false, last: 0, gotData: false };
    const handler = (e) => {
      const a = e.accelerationIncludingGravity;
      if (!a || a.x == null) return;
      const s = st.current;
      s.gotData = true;
      const m = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
      s.smooth = s.smooth * 0.75 + m * 0.25;
      s.base = s.base * 0.98 + m * 0.02;
      const diff = s.smooth - s.base;
      const now = Date.now();
      if (!s.above && diff > THRESHOLD && now - s.last > MIN_GAP_MS) {
        s.above = true;
        s.last = now;
        onStepRef.current?.(1);
      } else if (s.above && diff < THRESHOLD * 0.3) {
        s.above = false;
      }
    };
    handlerRef.current = handler;
    window.addEventListener("devicemotion", handler);
    setStatus("running");

    // Компьютер гэх мэт мэдрэгчгүй төхөөрөмж
    timerRef.current = setTimeout(() => {
      if (!st.current.gotData) {
        window.removeEventListener("devicemotion", handler);
        handlerRef.current = null;
        setStatus("nosensor");
      }
    }, 2500);
    return true;
  }, []);

  useEffect(() => stop, [stop]);

  return { status, start, stop };
}

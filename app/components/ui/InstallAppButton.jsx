"use client";

import { useEffect, useState } from "react";
import { Plus, Share2 } from "lucide-react";

export default function InstallAppButton() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
    setInstalled(Boolean(standalone));

    const ua = window.navigator.userAgent.toLowerCase();
    setIsIos(/iphone|ipad|ipod/.test(ua) || (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1));

    const handleBeforeInstall = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    const handleInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
      setShowInstructions(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const install = async () => {
    if (!installPrompt) {
      setShowInstructions((open) => !open);
      return;
    }

    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setInstallPrompt(null);
  };

  if (installed) return null;

  return (
    <div className="mt-5 flex flex-col items-center">
      <button
        onClick={install}
        aria-expanded={showInstructions}
        className="inline-flex items-center gap-2 rounded-full border-2 bb-border-FDE7F1 bg-white px-5 py-3 font-extrabold bb-text-B83B7E shadow-sm active:scale-95 transition"
      >
        <Plus className="w-5 h-5" /> Нүүр дэлгэцэд нэмэх
      </button>

      {showInstructions && (
        <p className="mt-3 max-w-xs rounded-2xl bb-bg-FDE7F1-70 px-4 py-3 text-center text-xs font-semibold text-slate-600">
          {isIos ? (
            <>
              Safari-ийн <Share2 className="inline w-3.5 h-3.5 align-[-2px]" /> Хуваалцах товчийг дараад{" "}
              <b>Нүүр дэлгэцэд нэмэх</b>-ийг сонгоно уу.
            </>
          ) : (
            <>
              Chrome-ийн <b>⋮</b> цэсийг нээгээд <b>Апп суулгах</b> эсвэл <b>Нүүр дэлгэцэд нэмэх</b>-ийг сонгоно уу.
            </>
          )}
        </p>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BloomApp from "../components/BloomApp";
import { supabase, supabaseConfigured } from "../../lib/supabase";

export default function SettingsPage() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    let active = true;
    if (!supabaseConfigured || !supabase) {
      router.replace("/");
      return () => {
        active = false;
      };
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (data.session) setAuthenticated(true);
      else router.replace("/");
    });

    return () => {
      active = false;
    };
  }, [router]);

  return authenticated ? <BloomApp initialTab="me" /> : null;
}

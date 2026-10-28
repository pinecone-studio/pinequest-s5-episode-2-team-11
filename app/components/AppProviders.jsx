"use client";

import { FamilyProvider } from "../../context/FamilyContext";
import { FriendsProvider } from "../../context/FriendsContext";
import { LanguageProvider } from "../../context/LanguageContext";
import { ThemeProvider } from "../../context/ThemeContext";

export default function AppProviders({ children }) {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <FamilyProvider>
          <FriendsProvider>{children}</FriendsProvider>
        </FamilyProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}

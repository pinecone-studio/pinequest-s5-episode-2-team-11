"use client";

import { FamilyProvider } from "../../context/FamilyContext";
import { FriendsProvider } from "../../context/FriendsContext";
import { LanguageProvider } from "../../context/LanguageContext";
import { OnboardingProvider } from "../../context/OnboardingContext";
import { ThemeProvider } from "../../context/ThemeContext";

export default function AppProviders({ children }) {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <FamilyProvider>
          <OnboardingProvider>
            <FriendsProvider>{children}</FriendsProvider>
          </OnboardingProvider>
        </FamilyProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}

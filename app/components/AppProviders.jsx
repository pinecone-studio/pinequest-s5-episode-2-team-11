"use client";

import { FamilyProvider } from "../../context/FamilyContext";
import { FriendsProvider } from "../../context/FriendsContext";
import { ThemeProvider } from "../../context/ThemeContext";

export default function AppProviders({ children }) {
  return (
    <ThemeProvider>
      <FamilyProvider>
        <FriendsProvider>{children}</FriendsProvider>
      </FamilyProvider>
    </ThemeProvider>
  );
}

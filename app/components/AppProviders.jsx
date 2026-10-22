"use client";

import { FamilyProvider } from "../../context/FamilyContext";
import { FriendsProvider } from "../../context/FriendsContext";

export default function AppProviders({ children }) {
  return (
    <FamilyProvider>
      <FriendsProvider>{children}</FriendsProvider>
    </FamilyProvider>
  );
}

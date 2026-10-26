export type FamilyRole = "mother" | "daughter";

export interface UserProfile {
  id: string;
  role: FamilyRole;
  display_name: string;
  family_id?: string | null;
}

export interface ChildProfile extends UserProfile {
  role: "daughter";
  avatarUrl?: string;
  avatar_url?: string | null;
  cycle_length?: number;
  period_length?: number;
  last_period_start?: string | null;
  no_period_yet?: boolean;
  share_mood?: boolean;
}

export interface GuardianData {
  guardianId: string;
  accessCode: string;
  children: ChildProfile[];
}

export type FamilyLinkStatus = "connected" | "unlinked" | "connecting";

export interface FamilyLinkingState {
  guardianCode: string;
  isLinked: boolean;
  guardianName: string | null;
  status: FamilyLinkStatus;
  error: string;
}

export interface FamilyLinkingContext {
  view: FamilyRole | null;
  children: ChildProfile[];
  familyCode: string;
  guardianName: string | null;
  isLinked: boolean;
  copied: boolean;
  copyCode: () => void | Promise<void>;
  shareCode: () => void | Promise<void>;
  guardianCode: string;
  setGuardianCode: (code: string) => void;
  linkStatus: FamilyLinkStatus;
  linkError: string;
  setLinkError: (message: string) => void;
  joining: boolean;
  connectToGuardian: () => void | Promise<void>;
  unlinking: boolean;
  leaveFamily: () => Promise<boolean>;
}

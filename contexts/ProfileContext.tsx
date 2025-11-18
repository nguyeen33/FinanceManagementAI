"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface Profile {
  job: string;
  income: number;
}

interface ProfileContextValue {
  profile: Profile | null;
  setProfile: (p: Profile) => void;
}

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfileState] = useState<Profile | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("user_profile");
    if (stored) {
      try {
        setProfileState(JSON.parse(stored));
      } catch {}
    }
  }, []);

  const setProfile = (p: Profile) => {
    setProfileState(p);
    localStorage.setItem("user_profile", JSON.stringify(p));
  };

  return (
    <ProfileContext.Provider value={{ profile, setProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be inside ProfileProvider");
  return ctx;
}

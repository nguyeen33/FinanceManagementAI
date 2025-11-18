"use client";

import { useProfile } from "@/contexts/ProfileContext";
import AIInsights from "./AIInsights";

export default function AIInsightsWithIncome() {
  const { profile } = useProfile();

  return <AIInsights income={profile?.income ?? null} />;
}

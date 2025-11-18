"use client";

import { useProfile } from "@/contexts/ProfileContext";

export default function ProfileDisplay() {
  const { profile } = useProfile();

  if (!profile) return null;

  return (
    <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/30 rounded-xl border border-green-200 dark:border-green-800">
      <p className="text-green-900 dark:text-green-200">
        <strong>Job Description:</strong> {profile.job}
      </p>
      <p className="text-green-900 dark:text-green-200">
        <strong>Income:</strong> {profile.income.toLocaleString("vi-VN")} $ / Month
      </p>
    </div>
  );
}

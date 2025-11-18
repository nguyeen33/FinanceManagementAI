"use client";

import React, { useState, useEffect } from "react";
import { addProfileIncome } from "@/app/actions/addProfileIncome";
import { useProfile } from "@/contexts/ProfileContext";

export default function AddProfileCard() {
  const { profile, setProfile } = useProfile();
  const [job, setJob] = useState("");
  const [income, setIncome] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    const timeout = window.setTimeout(() => {
      setJob(profile.job || "");
      setIncome(profile.income ? profile.income.toString() : "");
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [profile?.job, profile?.income]);

  const handleSave = async () => {
    if (!job || !income) {
      alert("Please fill out detailed info!");
      return;
    }

    setIsSaving(true);
    const res = await addProfileIncome(job, Number(income));
    setIsSaving(false);

    if (res) {
      setProfile({
        job: res.job ?? job,
        income: res.income ?? Number(income),
      });
      alert("Saved successfully!");
    } else {
      alert("Failed to save profile!");
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-md border border-gray-100 dark:border-gray-700">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-1">Add Profile</h2>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-5">Job description & Income</p>

      <div className="mb-4">
        <label className="block text-gray-700 dark:text-gray-200 font-medium mb-1">
          Job
        </label>
        <input
          type="text"
          placeholder="Ex: Developer, Teacher..."
          value={job}
          onChange={(e) => setJob(e.target.value)}
          className="w-full p-3 border rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-green-400 outline-none"
        />
      </div>

      <div className="mb-4">
        <label className="block text-gray-700 dark:text-gray-200 font-medium mb-1">
          Income (USD)
        </label>
        <input
          type="number"
          placeholder="Ex: 6000"
          value={income}
          onChange={(e) => setIncome(e.target.value)}
          className="w-full p-3 border rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-green-400 outline-none"
        />
      </div>

      <button
        onClick={handleSave}
        className="w-full bg-green-500 text-white py-3 rounded-xl font-medium hover:bg-green-600 transition disabled:opacity-60"
        disabled={isSaving}
      >
        {isSaving ? "Saving..." : "Add profile"}
      </button>
    </div>
  );
}

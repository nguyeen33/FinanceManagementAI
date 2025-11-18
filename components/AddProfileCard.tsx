"use client";

import React, { useState } from "react";

export default function AddProfileCard() {
  const [job, setJob] = useState("");
  const [income, setIncome] = useState("");

  const handleSave = () => {
    if (!job || !income) {
      alert("Please fill out detailed info!");
      return;
    }

    localStorage.setItem(
      "user_profile",
      JSON.stringify({
        job,
        income: Number(income),
      })
    );

    alert("Saved successfully!");
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-md border border-gray-100">
      <h2 className="text-xl font-semibold text-gray-900 mb-1">Add Profile</h2>
      <p className="text-gray-500 text-sm mb-5">Job description & Income</p>

      {/* Job */}
      <div className="mb-4">
        <label className="block text-gray-700 font-medium mb-1">
          Job
        </label>
        <input
          type="text"
          placeholder="EX: Developer, Teacher..."
          value={job}
          onChange={(e) => setJob(e.target.value)}
          className="w-full p-3 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-green-400 outline-none"
        />
      </div>

      {/* Income */}
      <div className="mb-4">
        <label className="block text-gray-700 font-medium mb-1">
          Income (USD)
        </label>
        <input
          type="number"
          placeholder="EX: 6000"
          value={income}
          onChange={(e) => setIncome(e.target.value)}
          className="w-full p-3 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-green-400 outline-none"
        />
      </div>

      <button
        onClick={handleSave}
        className="w-full bg-green-500 text-white py-3 rounded-xl font-medium hover:bg-green-600 transition"
      >
        Add profile
      </button>
    </div>
  );
}

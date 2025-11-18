"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function addProfileIncome(job: string, income: number) {
  const { userId } = await auth();

  if (!userId) return null;

  try {
    const user = await db.user.update({
      where: { clerkUserId: userId },
      data: {
      ...(job ? { job } : {}),
      income,
    },
    });

    return user;
  } catch (error) {
    console.error("Error updating profile:", error);
    return null;
  }
}

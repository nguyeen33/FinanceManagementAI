'use server';

import { checkUser } from '@/lib/checkUser';
import { db } from '@/lib/db';
import { generateAIAnswer, ExpenseRecord } from '@/lib/ai';

export async function generateInsightAnswer(question: string): Promise<string> {
  try {
    const user = await checkUser();
    if (!user) throw new Error('User not authenticated');

    // Get job + income
    const profile = await db.user.findUnique({
      where: { clerkUserId: user.clerkUserId },
      select: { job: true, income: true },
    });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const expenses = await db.record.findMany({
      where: {
        userId: user.clerkUserId,
        createdAt: { gte: thirtyDaysAgo },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const expenseData: ExpenseRecord[] = expenses.map((e) => ({
      id: e.id,
      amount: e.amount,
      category: e.category || "Other",
      description: e.text,
      date: e.createdAt.toISOString(),
    }));

    // TẠO PROMPT TỐT HƠN CHO AI
    const aiPrompt = `
User Profile:
- Job: ${profile?.job ?? "Unknown"}
- Monthly Income: ${profile?.income ?? "Unknown"}

Expenses (last 30 days): ${JSON.stringify(expenseData, null, 2)}

User Question:
${question}

Now provide an insight based on job, income and spending behaviour.
`;

    const answer = await generateAIAnswer(aiPrompt, expenseData);
    return answer;

  } catch (err) {
    console.error(err);
    return "I'm unable to generate insight right now.";
  }
}

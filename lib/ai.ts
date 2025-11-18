import OpenAI from 'openai';
import type { ChatCompletionContentPart } from 'openai/resources/chat/completions';

interface RawInsight {
  type?: string;
  title?: string;
  message?: string;
  action?: string;
  confidence?: number;
}

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'X-Title': 'FinanceManagement AI',
    'Content-Type': 'application/json',
  },
});


const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'mistralai/mixtral-8x7b-instruct:latest';

export interface ExpenseRecord {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
}

export interface AIInsight {
  id: string;
  type: 'warning' | 'info' | 'success' | 'tip';
  title: string;
  message: string;
  action?: string;
  confidence: number;
}

export interface UserProfileContext {
  job?: string | null;
  income?: number | null;
}

export interface ParsedExpense {
  description: string;
  amount: number;
  category?: string;
  date?: string;
}

export async function generateExpenseInsights(
  expenses: ExpenseRecord[],
  profile?: UserProfileContext
): Promise<AIInsight[]> {
  if (!process.env.OPENROUTER_API_KEY) {
    console.error('❌ OpenRouter API key is not configured');
    return [
      {
        id: 'config-error',
        type: 'warning',
        title: 'AI Service Not Configured',
        message: 'The AI service is not properly configured. Please contact support.',
        action: 'Contact support',
        confidence: 1.0,
      },
    ];
  }

  try {
    // Prepare expense data for AI analysis
    const expensesSummary = expenses.map((expense) => ({
      amount: expense.amount,
      category: expense.category,
      description: expense.description,
      date: expense.date,
    }));

    const profileSummary = profile
      ? `User Profile:
- Job: ${profile.job ?? 'Unknown'}
- Monthly Income: ${profile.income ?? 'Unknown'}`
      : 'User Profile: Unknown';

    const prompt = `Analyze the following user's financial situation and provide 3-4 actionable insights.
    
    ${profileSummary}

    Expense Data:
    ${JSON.stringify(expensesSummary, null, 2)}

    Return a JSON array of insights with this structure:
    Return a JSON array of insights with this structure:
    {
      "type": "warning|info|success|tip",
      "title": "Brief title",
      "message": "Detailed insight message with specific numbers when possible",
      "action": "Actionable suggestion",
      "confidence": 0.8
    }

    Focus on:
    1. Spending patterns (day of week, categories)
    2. Budget alerts (high spending areas)
    3. Money-saving opportunities
    4. Positive reinforcement for good habits

    Return only valid JSON array, no additional text.`;

    console.log('Using model for OpenRouter:', OPENROUTER_MODEL);
    const completion = await openai.chat.completions.create({
      model: OPENROUTER_MODEL,
      messages: [
        {
          role: 'system',
          content:
            'You are a financial advisor AI that analyzes spending patterns and provides actionable insights. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const response = completion.choices[0].message.content;
    if (!response) {
      throw new Error('No response from AI');
    }

    // Clean the response by removing markdown code blocks if present
    let cleanedResponse = response.trim();
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse
        .replace(/^```json\s*/, '')
        .replace(/\s*```$/, '');
    } else if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse
        .replace(/^```\s*/, '')
        .replace(/\s*```$/, '');
    }

    // Analyze AI response
    const insights = JSON.parse(cleanedResponse);

    // Add IDs and ensure proper format
    const formattedInsights = insights.map(
      (insight: RawInsight, index: number) => ({
        id: `ai-${Date.now()}-${index}`,
        type: insight.type || 'info',
        title: insight.title || 'AI Insight',
        message: insight.message || 'Analysis complete',
        action: insight.action,
        confidence: insight.confidence || 0.8,
      })
    );

    return formattedInsights;
  } catch (error) {
    console.error('❌ Error generating AI insights:', error);

    // Fallback to sample insights if AI fails
    return [
      {
        id: 'fallback-1',
        type: 'info',
        title: 'AI Analysis Unavailable',
        message:
          'Unable to generate personalized insights at this time. Please try again later.',
        action: 'Refresh insights',
        confidence: 0.5,
      },
    ];
  }
}

export async function categorizeExpense(description: string): Promise<string> {
  try {
    console.log('Using model for categorization:', OPENROUTER_MODEL);
    const completion = await openai.chat.completions.create({
      model: OPENROUTER_MODEL,
      messages: [
        {
          role: 'system',
          content:
            'You are an expense categorization AI. Categorize expenses into one of these categories: Food, Transportation, Entertainment, Shopping, Bills, Healthcare, Other. Respond with only the category name.',
        },
        {
          role: 'user',
          content: `Categorize this expense: "${description}"`,
        },
      ],
      temperature: 0.1,
      max_tokens: 20,
    });

    const category = completion.choices[0].message.content?.trim();

    const validCategories = [
      'Food',
      'Transportation',
      'Entertainment',
      'Shopping',
      'Bills',
      'Healthcare',
      'Other',
    ];

    const finalCategory = validCategories.includes(category || '')
      ? category!
      : 'Other';
    return finalCategory;
  } catch (error) {
    console.error('❌ Error categorizing expense:', error);
    return 'Other';
  }
}

export async function generateAIAnswer(
  question: string,
  context: ExpenseRecord[]
): Promise<string> {
  try {
    const expensesSummary = context.map((expense) => ({
      amount: expense.amount,
      category: expense.category,
      description: expense.description,
      date: expense.date,
    }));

    const prompt = `Based on the following expense data, provide a detailed and actionable answer to this question: "${question}"

    Expense Data:
    ${JSON.stringify(expensesSummary, null, 2)}

    Provide a comprehensive answer that:
    1. Addresses the specific question directly
    2. Uses concrete data from the expenses when possible
    3. Offers actionable advice
    4. Keeps the response concise but informative (2-3 sentences)
    
    Return only the answer text, no additional formatting.`;

    console.log('Using model for Q&A:', OPENROUTER_MODEL);
    const completion = await openai.chat.completions.create({
      model: OPENROUTER_MODEL,
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful financial advisor AI that provides specific, actionable answers based on expense data. Be concise but thorough.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 200,
    });

    const response = completion.choices[0].message.content;
    if (!response) {
      throw new Error('No response from AI');
    }

    return response.trim();
  } catch (error) {
    console.error('❌ Error generating AI answer:', error);
    return "I'm unable to provide a detailed answer at the moment. Please try refreshing the insights or check your connection.";
  }
}

function cleanJsonResponse(response: string): string {
  let cleaned = response.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return cleaned;
}

const AMOUNT_KEYWORDS = [
  'total',
  'amount due',
  'balance due',
  'grand total',
  'subtotal',
  'total due',
  'total usd',
];

const DESCRIPTION_KEYWORDS = [
  'expense',
  'description',
  'item',
  'service',
  'product',
  'package',
  'project',
  'bill to',
];

function parseAmountFromLine(line: string): number | null {
  const match = line.match(/([-+]?\$?\s*\d[\d,]*(?:\.\d{1,2})?)/);
  if (!match) return null;
  const normalized = match[1].replace(/[^0-9.-]/g, '');
  const amount = parseFloat(normalized);
  return Number.isFinite(amount) ? amount : null;
}

interface InvoiceRow {
  description: string;
  amount: number;
  index: number;
  isTotal?: boolean;
}

function invoiceHeuristic(text: string): ParsedExpense | null {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return null;

  let detectedAmount: number | null = null;
  let detectedDescription: string | null = null;
  const itemRows: InvoiceRow[] = [];

  for (const line of lines) {
    const lower = line.toLowerCase();

    if (!detectedAmount && AMOUNT_KEYWORDS.some((kw) => lower.includes(kw))) {
      detectedAmount = parseAmountFromLine(line);
      detectedDescription = 'Invoice total';
    }

    if (
      !detectedDescription &&
      DESCRIPTION_KEYWORDS.some((kw) => lower.includes(kw))
    ) {
      const cleaned = line.replace(/[:\-]/g, '').trim();
      if (cleaned.length > 0) {
        detectedDescription = cleaned;
      }
    }

    if (detectedAmount && detectedDescription) {
      break;
    }
  }

  lines.forEach((line, idx) => {
    const amount = parseAmountFromLine(line);
    if (!amount) return;

    const lower = line.toLowerCase();
    if (AMOUNT_KEYWORDS.some((kw) => lower.includes(kw))) {
      itemRows.push({ description: 'Invoice total', amount, index: idx, isTotal: true });
      return;
    }

    const headerRegex = /(description|amount|qty|quantity|price)/i;
    if (headerRegex.test(line)) return;

    const match = line.match(/^(.*?)([-+]?\$?\s*\d[\d,]*(?:\.\d{1,2})?)\s*$/);
    const textPart = match ? match[1].trim() : line.replace(/[-+]?\$?\s*\d[\d,]*(?:\.\d{1,2})?/g, '').trim();

    if (!textPart) return;

    itemRows.push({ description: textPart, amount, index: idx });
  });

  if (!detectedAmount) {
    const totalRow = itemRows.find((row) => row.isTotal);
    if (totalRow) {
      detectedAmount = totalRow.amount;
      detectedDescription = 'Invoice total';
    } else if (itemRows.length > 0) {
      detectedAmount = itemRows.reduce((sum, row) => sum + row.amount, 0);
      const sampleDescriptions = itemRows
        .slice(0, 3)
        .map((row) => row.description)
        .join(', ');
      detectedDescription = `Invoice items: ${sampleDescriptions}`;
    }
  }

  if (!detectedAmount) {
    // fallback to highest numeric amount in entire text
    const numberMatches = [...text.matchAll(/(?:USD|\$)?\s?([\d.,]+)\b/g)];
    const numericValues = numberMatches
      .map((match) => {
        const raw = match[1].replace(/,/g, '');
        const value = parseFloat(raw);
        return Number.isFinite(value) ? value : null;
      })
      .filter((value): value is number => value !== null);

    if (numericValues.length > 0) {
      detectedAmount = Math.max(...numericValues);
      detectedDescription = 'Invoice total';
    }
  }

  if (!detectedAmount) return null;

  if (!detectedDescription) {
    // try to pick the line preceding an amount keyword
    for (let i = 0; i < lines.length; i += 1) {
      const lower = lines[i].toLowerCase();
      if (AMOUNT_KEYWORDS.some((kw) => lower.includes(kw))) {
        const previous = lines[i - 1];
        if (previous) {
          detectedDescription = previous;
          break;
        }
      }
    }
  }

  const fallbackDescription =
    detectedDescription || itemRows[0]?.description || lines.find((line) => line.length > 3) || 'Uploaded receipt';

  return {
    amount: detectedAmount,
    description: fallbackDescription.slice(0, 200),
    category: 'Other',
  };
}

function basicTextExtraction(text?: string): ParsedExpense | null {
  if (!text) return null;

  const invoiceMatch = invoiceHeuristic(text);
  if (invoiceMatch) return invoiceMatch;

  return null;
}

export async function extractExpenseDetails(input: {
  text?: string;
  imageBase64?: string;
  mimeType?: string;
}): Promise<ParsedExpense | null> {
  if (!input.text && !input.imageBase64) {
    return null;
  }

  if (!process.env.OPENROUTER_API_KEY) {
    return basicTextExtraction(input.text);
  }

  try {
    const systemPrompt =
      'You are an assistant that extracts structured expense data from receipts, invoices, and CSV text. Always respond with valid JSON: {"description": string, "amount": number, "category": string, "date": string}. Amount must be just a number without currency symbols. If information is missing, infer a short description and default category "Other".';

    const userContent: string | ChatCompletionContentPart[] | undefined =
      input.imageBase64
        ? [
            {
              type: 'text',
              text:
                'Analyze this receipt image and return JSON with description, amount, category, and date (if present).',
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${input.mimeType ?? 'image/png'};base64,${
                  input.imageBase64
                }`,
              },
            },
          ]
        : `Extract the total amount, merchant/description, category, and date if available. Respond with JSON.\n\nContent:\n${input.text?.slice(
            0,
            12000
          )}`;

    const completion = await openai.chat.completions.create({
      model: OPENROUTER_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: userContent ?? 'No content provided.',
        },
      ],
      temperature: 0.2,
      max_tokens: 500,
    });

    const response = completion.choices[0].message.content;
    if (!response) {
      throw new Error('No response from AI while extracting expense details.');
    }

    const parsed = JSON.parse(cleanJsonResponse(response));
    if (typeof parsed.amount !== 'number') {
      parsed.amount = Number(parsed.amount);
    }

    return {
      description: parsed.description || 'Uploaded receipt',
      amount: parsed.amount,
      category: parsed.category || 'Other',
      date: parsed.date,
    };
  } catch (error) {
    console.error('❌ Error extracting expense details:', error);
    return basicTextExtraction(input.text);
  }
}

export function extractExpenseFromPlainText(text: string): ParsedExpense | null {
  return basicTextExtraction(text);
}

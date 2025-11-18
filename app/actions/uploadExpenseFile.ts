"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  extractExpenseDetails,
  extractExpenseFromPlainText,
  ParsedExpense,
} from "@/lib/ai";

interface UploadResult {
  success: boolean;
  message: string;
  recordId?: string;
}

const IMAGE_MIME_PREFIX = "image/";

function parseFallbackAmount(value: FormDataEntryValue | null): number | undefined {
  if (!value) return undefined;
  const parsed = parseFloat(value.toString());
  return Number.isFinite(parsed) ? parsed : undefined;
}

async function parseTextBasedFile(buffer: Buffer): Promise<string> {
  return buffer.toString("utf-8");
}

type MutableGlobal = typeof globalThis & {
  window?: Window & typeof globalThis;
  navigator?: Navigator;
  screen?: Screen;
};

async function parsePdf(buffer: Buffer): Promise<string> {
  const globalAny = globalThis as MutableGlobal;

  if (typeof globalAny.window === "undefined") {
    globalAny.window = {} as Window & typeof globalThis;
  }
  if (typeof globalAny.navigator === "undefined") {
    globalAny.navigator = { userAgent: "node.js" } as Navigator;
  }
  if (typeof globalAny.screen === "undefined") {
    globalAny.screen = {} as Screen;
  }

  // Import pdf-parse một lần
  const pdfModule = await import("pdf-parse");

  // Fix lỗi ESM/CJS khi deploy lên Vercel
  const pdfParse =
    (pdfModule as any).default && typeof (pdfModule as any).default === "function"
      ? (pdfModule as any).default
      : pdfModule;

  const data = await pdfParse(buffer);
  return data.text;
}




async function runImageOCR(buffer: Buffer): Promise<string | null> {
  try {
    const { recognize } = await import("tesseract.js");
    const result = await recognize(buffer, "eng");
    return result.data.text;
  } catch (error) {
    console.error("OCR failed:", error);
    return null;
  }
}

function normalizeDate(input?: string): string {
  if (!input) {
    return new Date().toISOString();
  }

  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString();
  }

  return parsed.toISOString();
}

export default async function uploadExpenseFile(
  formData: FormData
): Promise<UploadResult> {
  const fileEntry = formData.get("receipt");
  const fallbackDescription = formData.get("description")?.toString();
  const fallbackCategory = formData.get("category")?.toString();
  const fallbackAmount = parseFallbackAmount(formData.get("amount"));

  if (!fileEntry || !(fileEntry instanceof File)) {
    return { success: false, message: "Please choose a file to upload." };
  }

  const { userId } = await auth();
  if (!userId) {
    return { success: false, message: "You must be signed in to upload files." };
  }

  const arrayBuffer = await fileEntry.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const mimeType = fileEntry.type || "";
  const fileName = fileEntry.name || "uploaded-receipt";

  let parsedExpense: ParsedExpense | null = null;

  try {
    if (
      mimeType.includes("csv") ||
      fileName.toLowerCase().endsWith(".csv")
    ) {
      const textContent = await parseTextBasedFile(buffer);
      parsedExpense =
        (await extractExpenseDetails({ text: textContent })) ??
        extractExpenseFromPlainText(textContent);
    } else if (
      mimeType === "application/pdf" ||
      fileName.toLowerCase().endsWith(".pdf")
    ) {
      const pdfText = await parsePdf(buffer);
      parsedExpense =
        (await extractExpenseDetails({ text: pdfText })) ??
        extractExpenseFromPlainText(pdfText);
    } else if (mimeType.startsWith(IMAGE_MIME_PREFIX)) {
      const base64 = buffer.toString("base64");
      parsedExpense =
        (await extractExpenseDetails({
          imageBase64: base64,
          mimeType,
        })) ?? null;

      if (!parsedExpense) {
        const ocrText = await runImageOCR(buffer);
        if (ocrText) {
          parsedExpense =
            (await extractExpenseDetails({ text: ocrText })) ??
            extractExpenseFromPlainText(ocrText);
        }
      }
    } else {
      const fallbackText = await parseTextBasedFile(buffer);
      parsedExpense =
        (await extractExpenseDetails({ text: fallbackText })) ??
        extractExpenseFromPlainText(fallbackText);
    }
  } catch (error) {
    console.error("Failed to extract expense details:", error);
    return {
      success: false,
      message: "Unable to read the uploaded file. Please try another file.",
    };
  }

  const amount = parsedExpense?.amount ?? fallbackAmount;
  const description =
    parsedExpense?.description ??
    fallbackDescription ??
    `Uploaded receipt (${fileName})`;
  const category = parsedExpense?.category ?? fallbackCategory ?? "Other";
  const date = normalizeDate(parsedExpense?.date);

  if (!amount || amount <= 0) {
    return {
      success: false,
      message:
        "Could not detect the total amount in this file. Please enter it manually.",
    };
  }

  try {
    const record = await db.record.create({
      data: {
        text: description,
        amount,
        category,
        date,
        userId,
      },
    });

    revalidatePath("/");

    return {
      success: true,
      message: "Expense created from uploaded file.",
      recordId: record.id,
    };
  } catch (error) {
    console.error("Error saving expense from file:", error);
    return {
      success: false,
      message: "Failed to save the expense. Please try again.",
    };
  }
}



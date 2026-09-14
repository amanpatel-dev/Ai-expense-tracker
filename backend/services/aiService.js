const fs = require("fs/promises");
const path = require("path");

// OpenRouter uses OPENROUTER_API_KEY from backend/.env (loaded via dotenv in server.js)

async function testAI() {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "openrouter/free",
      messages: [
        {
          role: "user",
          content: "Say hello in one short sentence.",
        },
      ],
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const message =
      data?.error?.message || data?.message || JSON.stringify(data);
    throw new Error(`OpenRouter error ${response.status}: ${message}`);
  }

  return data.choices[0].message.content;
}

function getMimeType(imagePath) {
  const ext = path.extname(imagePath).toLowerCase();

  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";

  throw new Error(`Unsupported image type: ${ext || "(none)"}`);
}

function parseJsonFromAI(text) {
  let cleaned = text.trim();

  // Models sometimes wrap JSON in ```json ... ``` fences
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }

  try {
    return JSON.parse(cleaned);
  } catch (error) {
    throw new Error(`AI response was not valid JSON: ${text}`);
  }
}

async function analyzeReceiptImage(imagePath) {
  const mimeType = getMimeType(imagePath);
  const imageBuffer = await fs.readFile(imagePath);
  const base64Image = imageBuffer.toString("base64");
  const dataUrl = `data:${mimeType};base64,${base64Image}`;

  const prompt = `Analyze this receipt image and extract expense details.

Rules:
- merchant: the store, restaurant, company, or vendor name visible on the receipt.
- amount: the final total amount paid only (not a subtotal or an individual item price). Do not use currency symbols. amount must be a JSON number, not a string.
- category: MUST be exactly one of these values: Food, Transport, Shopping, Entertainment, Bills, Health, Education, Other.
- description: a short human-readable description of what was purchased.
- date: the receipt date formatted as YYYY-MM-DD.
- If a field cannot be reliably determined from the image, return null.
- Never invent information.
- Return ONLY valid JSON. Do not wrap the JSON in markdown.

Return JSON with this exact shape:
{
"merchant": "string or null",
"amount": "number or null",
"category": "string or null",
"description": "string or null",
"date": "YYYY-MM-DD or null"
}`;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "openrouter/free",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: dataUrl,
              },
            },
          ],
        },
      ],
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const message =
      data?.error?.message || data?.message || JSON.stringify(data);
    throw new Error(`OpenRouter error ${response.status}: ${message}`);
  }

  const content = data.choices[0].message.content;
  return parseJsonFromAI(content);
}

async function generateExpenseSummary(transactions) {
  const prompt = `You are an expense analysis assistant.

Analyze the provided transactions and calculate:

1. Total expenses
2. Total income
3. Spending by category
4. Highest spending category
5. Number of expense transactions
6. Number of income transactions
7. A few useful spending insights

Important:
- Use ONLY the provided transaction data.
- Do not invent numbers.
- Calculate totals from the transactions.
- Return ONLY valid JSON.
- Do not use markdown.
- Do not include currency symbols in numeric values.

Return exactly this structure:
{
  "totalExpense": 0,
  "totalIncome": 0,
  "expenseTransactionCount": 0,
  "incomeTransactionCount": 0,
  "topCategory": "Food",
  "categoryBreakdown": {
    "Food": 0,
    "Transport": 0,
    "Shopping": 0,
    "Entertainment": 0,
    "Bills": 0,
    "Health": 0,
    "Education": 0,
    "Other": 0
  },
  "insights": [
    "string",
    "string"
  ]
}

Transactions:
${JSON.stringify(transactions)}`;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "openrouter/free",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const message =
      data?.error?.message || data?.message || JSON.stringify(data);
    throw new Error(`OpenRouter error ${response.status}: ${message}`);
  }

  const content = data.choices[0].message.content;
  return parseJsonFromAI(content);
}

module.exports = {
  testAI,
  analyzeReceiptImage,
  generateExpenseSummary,
};

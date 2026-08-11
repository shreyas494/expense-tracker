import { createWorker } from 'tesseract.js';

export function parseTransactionText(text) {
  const textLower = text.toLowerCase();
  let type = "expense";
  
  // 1. Determine Type (Debit vs Credit)
  const hasCreditKeywords = 
    textLower.includes("credited") || 
    textLower.includes("received") || 
    textLower.includes("deposited") || 
    textLower.includes("added to") ||
    textLower.includes("refunded") ||
    textLower.includes("cr. to") ||
    textLower.includes("cr to");
    
  const hasDebitKeywords =
    textLower.includes("debited") ||
    textLower.includes("spent") ||
    textLower.includes("paid") ||
    textLower.includes("transferred") ||
    textLower.includes("withdrawn") ||
    textLower.includes("dr. from") ||
    textLower.includes("dr from");

  if (hasCreditKeywords && !textLower.includes("dr. from") && !textLower.includes("dr from")) {
    type = "income";
  }

  // 2. Extract Amount (Matches ₹1, ₹ 1, Rs. 250, INR 150, 1.00, etc.)
  let amount = 0;
  const amountMatch = text.match(/(?:rs\.?|inr|re\.?|₹)\s*([\d,]+(?:\.\d{1,2})?)/i);
  if (amountMatch && amountMatch[1]) {
    amount = parseFloat(amountMatch[1].replace(/,/g, ""));
  } else {
    const standaloneMatch = text.match(/₹\s*(\d+(?:\.\d{1,2})?)/);
    if (standaloneMatch && standaloneMatch[1]) {
      amount = parseFloat(standaloneMatch[1]);
    }
  }

  // 3. Extract Merchant / Recipient Name
  let description = "";
  const recipientMatch = text.match(/(?:paid to|sent to|paid|transfer to|to VPA|to merchant|vpa|info)\s+([a-zA-Z0-9\s\.\*\/&@_-]+?)(?:\s+on|\s+ref|\s+link|\s+via|\s+balance|\s+using|sent to|\.|\n|$)/i);
  
  if (recipientMatch && recipientMatch[1]) {
    let rawMerchant = recipientMatch[1].trim();
    if (rawMerchant.includes('@')) {
      rawMerchant = rawMerchant.split('@')[0];
    }
    rawMerchant = rawMerchant.replace(/^(using|via|on|for|g pay|phonepe)\s+/i, '').trim();
    if (rawMerchant.length > 1 && !rawMerchant.toLowerCase().includes('phonepe') && !rawMerchant.toLowerCase().includes('gpay')) {
      description = rawMerchant;
    }
  }

  if (!description) {
    const merchMatch = text.match(/(?:at|from)\s+([a-zA-Z0-9\s\.\*\/&@_-]+?)(?:\s+on|\s+ref|\.|\n|$)/i);
    if (merchMatch && merchMatch[1]) {
      description = merchMatch[1].trim();
    }
  }

  if (!description || description.toLowerCase().includes("explore the app") || description.toLowerCase().includes("download")) {
    description = "Payment Transaction";
  }

  description = description.replace(/[\n\r]+/g, " ").replace(/\s+/g, " ").trim();
  description = description.charAt(0).toUpperCase() + description.slice(1);

  // 4. Auto-Categorize
  let category = type === "income" ? "Salary" : "Other";
  const descLower = description.toLowerCase();

  if (descLower.includes("swiggy") || descLower.includes("zomato") || descLower.includes("restaurant") || descLower.includes("cafe") || descLower.includes("food") || descLower.includes("kfc") || descLower.includes("mcdonald") || descLower.includes("starbucks") || descLower.includes("domino")) {
    category = "Food";
  } else if (descLower.includes("uber") || descLower.includes("ola") || descLower.includes("rapido") || descLower.includes("metro") || descLower.includes("petrol") || descLower.includes("fuel") || descLower.includes("shell") || descLower.includes("transport")) {
    category = "Transport";
  } else if (descLower.includes("amazon") || descLower.includes("flipkart") || descLower.includes("myntra") || descLower.includes("ajio") || descLower.includes("meesho") || descLower.includes("shopping") || descLower.includes("mart") || descLower.includes("bazaar")) {
    category = "Shopping";
  } else if (descLower.includes("bookmyshow") || descLower.includes("netflix") || descLower.includes("spotify") || descLower.includes("cinema") || descLower.includes("movie") || descLower.includes("game")) {
    category = "Entertainment";
  } else if (descLower.includes("recharge") || descLower.includes("jio") || descLower.includes("airtel") || descLower.includes("electricity") || descLower.includes("water") || descLower.includes("bill") || descLower.includes("broadband")) {
    category = "Utilities";
  } else if (descLower.includes("pharmacy") || descLower.includes("apollo") || descLower.includes("hospital") || descLower.includes("doctor") || descLower.includes("health") || descLower.includes("clinic")) {
    category = "Healthcare";
  } else if (descLower.includes("rent") || descLower.includes("society") || descLower.includes("maintenance") || descLower.includes("housing")) {
    category = "Housing";
  } else if (type === "income") {
    if (descLower.includes("freelance") || descLower.includes("upwork") || descLower.includes("fiverr")) category = "Freelance";
    else if (descLower.includes("dividend") || descLower.includes("interest") || descLower.includes("stock") || descLower.includes("invest")) category = "Investment";
    else if (descLower.includes("bonus") || descLower.includes("cashback") || descLower.includes("reward")) category = "Bonus";
  }

  return { type, amount, description, category };
}

export async function scanReceiptWithOCR(imageSource) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (apiKey) {
    try {
      let base64Data = '';
      if (typeof imageSource === 'string' && imageSource.startsWith('data:image')) {
        base64Data = imageSource.replace(/^data:image\/\w+;base64,/, '');
      } else if (imageSource instanceof Blob || imageSource instanceof File) {
        base64Data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result.replace(/^data:image\/\w+;base64,/, ''));
          reader.onerror = reject;
          reader.readAsDataURL(imageSource);
        });
      }

      if (base64Data) {
        const models = ['gemini-2.5-flash', 'gemini-1.5-flash'];
        for (const model of models) {
          try {
            const geminiRes = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: [{
                    parts: [
                      { inlineData: { mimeType: 'image/png', data: base64Data } },
                      { text: 'Analyze this UPI/bank payment receipt screenshot. Extract exact payment amount (number), type (expense or income), and recipient/merchant name string. Return ONLY raw JSON without markdown: {"amount": 1, "type": "expense", "description": "merchant or person name", "category": "Food"|"Transport"|"Shopping"|"Utilities"|"Healthcare"|"Housing"|"Salary"|"Other"}' }
                    ]
                  }]
                })
              }
            );

            if (geminiRes.ok) {
              const jsonResult = await geminiRes.json();
              const rawText = jsonResult?.candidates?.[0]?.content?.parts?.[0]?.text || '';
              const cleanedJsonStr = rawText.replace(/```json|```/g, '').trim();
              const parsedAi = JSON.parse(cleanedJsonStr);

              return {
                success: true,
                rawText: `Paid to ${parsedAi.description || ''} ₹${parsedAi.amount || 0}`,
                amount: Number(parsedAi.amount) || 0,
                description: parsedAi.description || "Payment Transaction",
                category: parsedAi.category || "Other",
                type: parsedAi.type || "expense"
              };
            }
          } catch (mErr) {
            console.error(`Gemini model ${model} error:`, mErr);
          }
        }
      }
    } catch (gErr) {
      console.error("Gemini frontend scan error:", gErr);
    }
  }

  // Fallback to Tesseract OCR
  try {
    const worker = await createWorker('eng');
    const ret = await worker.recognize(imageSource);
    await worker.terminate();

    const rawText = ret.data.text || '';
    const parsed = parseTransactionText(rawText);
    return { success: true, rawText, ...parsed };
  } catch (err) {
    console.error("In-browser OCR failed:", err);
    return { success: false, amount: 0, description: "Shared Payment Receipt", category: "Other", type: "expense" };
  }
}

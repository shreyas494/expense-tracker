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
    
  if (hasCreditKeywords && !textLower.includes("dr. from") && !textLower.includes("dr from")) {
    type = "income";
  }

  // 2. Extract Amount (Handles ₹1, ₹ 1, Rs 1, INR 1, and digits next to ₹)
  let amount = 0;
  const amountMatches = text.match(/(?:rs\.?|inr|re\.?|₹|\$|€|£)\s*([\d,]+(?:\.\d{1,2})?)/gi);
  if (amountMatches && amountMatches.length > 0) {
    for (const m of amountMatches) {
      const numStr = m.replace(/[^0-9\.]/g, '');
      const parsedNum = parseFloat(numStr);
      if (parsedNum > 0) {
        amount = parsedNum;
        break;
      }
    }
  }

  if (amount === 0) {
    // Fallback: look for standalone rupee numbers or digits near Paid to / Debited from
    const standaloneMatch = text.match(/(?:₹|rs\.?|inr)\s*(\d+(?:\.\d{1,2})?)/i) || text.match(/(?:paid to|debited|total|amount)\b[\s\S]*?(\d+(?:\.\d{1,2})?)/i);
    if (standaloneMatch && standaloneMatch[1]) {
      amount = parseFloat(standaloneMatch[1]);
    }
  }

  // 3. Extract Merchant / Recipient Name
  let description = "";
  
  // Handle multiline PhonePe / GPay receipt screenshots: "Paid to\nUddesh Bhagyawant PICT"
  const paidToNextLine = text.match(/(?:paid to|sent to|transfer to)\s*[\n\r]+\s*([^\n\r]+)/i);
  if (paidToNextLine && paidToNextLine[1]) {
    description = paidToNextLine[1].trim();
  }

  if (!description) {
    const inlineRecipientMatch = text.match(/(?:paid to|sent to|paid|transfer to|to VPA|to merchant|vpa|info)\s+([a-zA-Z0-9\s\.\*\/&@_-]+?)(?:\s+on|\s+ref|\s+link|\s+via|\s+balance|\s+using|sent to|\.|\n|$)/i);
    if (inlineRecipientMatch && inlineRecipientMatch[1]) {
      description = inlineRecipientMatch[1].trim();
    }
  }

  if (!description) {
    const merchMatch = text.match(/(?:at|from)\s+([a-zA-Z0-9\s\.\*\/&@_-]+?)(?:\s+on|\s+ref|\.|\n|$)/i);
    if (merchMatch && merchMatch[1]) {
      description = merchMatch[1].trim();
    }
  }

  // Clean description string
  if (description) {
    if (description.includes('@')) {
      description = description.split('@')[0];
    }
    // Remove amount or currency symbols if attached to name
    description = description.replace(/(?:rs\.?|inr|re\.?|₹)\s*\d+.*/gi, '');
    description = description.replace(/^(using|via|on|for|g pay|phonepe)\s+/i, '');
    description = description.replace(/[\n\r]+/g, " ").replace(/\s+/g, " ").trim();
  }

  if (!description || description.length < 2 || description.toLowerCase().includes("explore the app") || description.toLowerCase().includes("download")) {
    description = "Payment Transaction";
  }

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
  let apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey.startsWith('AQ.')) {
    apiKey = 'AIzaSyA_LspGJzzqs431_Cj4vMG9HgTO6WL8kGU';
  }
  const debugLog = [];

  if (apiKey) {
    debugLog.push(`Gemini Key Found (${apiKey.slice(0, 6)}...)`);
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
            debugLog.push(`Calling ${model}`);
            const reqHeaders = {
              'Content-Type': 'application/json',
              'x-goog-api-key': apiKey
            };
            if (apiKey.startsWith('AQ.')) {
              reqHeaders['Authorization'] = `Bearer ${apiKey}`;
            }

            const geminiRes = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
              {
                method: 'POST',
                headers: reqHeaders,
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
              debugLog.push(`AI Success: ₹${parsedAi.amount} to ${parsedAi.description}`);

              return {
                success: true,
                rawText: `AI: ${parsedAi.description || 'Payment'} ₹${parsedAi.amount || 0}`,
                amount: Number(parsedAi.amount) || 0,
                description: parsedAi.description || "Payment Transaction",
                category: parsedAi.category || "Other",
                type: parsedAi.type || "expense",
                debug: debugLog.join(' → ')
              };
            } else {
              const errTxt = await geminiRes.text();
              debugLog.push(`Gemini ${model} HTTP ${geminiRes.status}: ${errTxt.slice(0, 120)}`);
            }
          } catch (mErr) {
            debugLog.push(`Gemini ${model} err: ${mErr.message}`);
          }
        }
      }
    } catch (gErr) {
      debugLog.push(`Gemini error: ${gErr.message}`);
    }
  } else {
    debugLog.push('VITE_GEMINI_API_KEY missing in environment variables');
  }

  // Fallback to Tesseract OCR
  try {
    debugLog.push('Running Tesseract OCR');
    const worker = await createWorker('eng');
    const ret = await worker.recognize(imageSource);
    await worker.terminate();

    const rawText = ret.data.text || '';
    debugLog.push(`Tesseract raw text length: ${rawText.length}`);
    const parsed = parseTransactionText(rawText);

    if (parsed.amount === 0) {
      debugLog.push('Tesseract found text but could not parse amount > 0');
    }

    const outputText = parsed.description !== "Payment Transaction" ? rawText : `Log: ${debugLog.join(' | ')}`;

    return {
      success: true,
      rawText: outputText || 'No text recognized',
      ...parsed,
      debug: debugLog.join(' → ')
    };
  } catch (err) {
    debugLog.push(`Tesseract failed: ${err.message}`);
    return {
      success: false,
      amount: 0,
      description: "Shared Payment Receipt",
      category: "Other",
      type: "expense",
      rawText: `Log: ${debugLog.join(' | ')}`,
      debug: debugLog.join(' → ')
    };
  }
}

import { GoogleGenAI } from "@google/genai";
import { Order } from "../types";

// Always use a named parameter for the API key and assume it is available in process.env.API_KEY.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeOrders = async (orders: Order[]): Promise<string> => {
  try {
    const ordersJson = JSON.stringify(orders);
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a supply chain assistant. Analyze the following orders in Persian (Farsi).
      Provide a brief summary of total sales, best selling items, and any actionable insights for the supplier.
      IMPORTANT: Format all currency amounts with 3-digit separators (e.g., 18,000,000) for readability.
      Keep it professional and concise.
      
      Orders Data: ${ordersJson}`,
    });

    return response.text || "خطا در دریافت پاسخ از هوش مصنوعی.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "متاسفانه مشکلی در ارتباط با هوش مصنوعی پیش آمده است.";
  }
};
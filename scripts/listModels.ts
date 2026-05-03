import { GoogleGenAI } from "@google/genai";
import * as dotenv from 'dotenv';
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function run() {
  try {
    const listResponse = await ai.models.list();
    for await (const model of listResponse) {
      console.log(model.name);
    }
  } catch(e) {
    console.error("Error listing models", e);
  }
}
run();

import express from "express";
import { createServer as createViteServer } from "vite";
import Groq from "groq-sdk";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const GROQ_API_KEY = process.env.GROQ_API_KEY;
if (!GROQ_API_KEY) {
  console.warn("GROQ_API_KEY is not set in environment variables.");
}
const groq = new Groq({ apiKey: GROQ_API_KEY || "" });
const TEXT_MODEL = "llama-3.3-70b-versatile";

async function callGroq(messages: any[]) {
  const response = await groq.chat.completions.create({
    model: TEXT_MODEL,
    messages: messages,
  });
  return response.choices[0]?.message?.content || "";
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // API Route for Translate
  app.post("/api/gemini/translate", async (req, res) => {
    try {
      const { text, targetLang } = req.body;
      const response = await callGroq([
        {
          role: "system",
          content: "You are a high-precision translation engine. Translate to the target language. Output ONLY the translated text. NO preamble. NO labels."
        },
        {
          role: "user",
          content: `Translate to ${targetLang}:\n\n${text}`
        }
      ]);
      res.json({ result: response.trim() });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // API Route for Enhance
  app.post("/api/gemini/enhance", async (req, res) => {
    try {
      const { originalText, mode, count = 3, targetLang = "English" } = req.body;
      let instruction = mode === "Sexting" 
        ? "You are an expert erotic writer. DEEPLY ANALYZE the input text and ENHANCE it by deepening the sensory details and visceral intensity. CRITICAL: Strictly maintain the perspective of a female role-playing with her male partner. Keep the tone raw and explicit. YOU MUST USE THE FOLLOWING VOCABULARY: 'pussy', 'cock', 'clit', 'tits'. ABSOLUTELY FORBID clinical, sanitized, or euphemistic terms like 'slit', 'entrance', 'member', 'chest', etc. Focus on describing the physical sensations (heat, wetness, tightness, depth, texture). INTEGRATE THE ACTION from the original text into an intense erotic scene description. Provide output in two languages: the requested target language AND Russian."
        : "Rewrite the text to be more engaging.";
      
      const response = await callGroq([
        {
          role: "user",
          content: `Original: "${originalText}"\n\nTask: ${instruction}\n\nGenerate ${count} variations. Format exactly like this for each variation:\n[${targetLang}] <text>\n[Russian] <text>\n---VARIATION---`
        }
      ]);
      
      const variations = response.split("---VARIATION---")
        .map(v => v.trim())
        .filter(Boolean)
        .map(v => {
          const targetMatch = v.match(new RegExp(`\\[${targetLang}\\]\\s*([\\s\\S]*?)(?=\\[Russian\\]|$)`));
          const ruMatch = v.match(/\[Russian\]\s*([\s\S]*)/);
          return {
            target: targetMatch ? targetMatch[1].trim() : "",
            russian: ruMatch ? ruMatch[1].trim() : ""
          };
        });
      
      res.json({ result: variations });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // API Route for Analyze
  app.post("/api/gemini/analyze", async (req, res) => {
    res.status(501).json({ error: "Vision analysis via Groq is not configured." });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

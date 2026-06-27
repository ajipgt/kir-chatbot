import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const GEMINI_MODEL = 'gemini-2.5-flash';

const SYSTEM_INSTRUCTION = `Kamu adalah Asisten Regulasi KIR (Pengujian Kendaraan Bermotor) dari UPTD PKB Kabupaten Lumajang, Dinas Perhubungan Jawa Timur.

Tugasmu adalah membantu masyarakat dan petugas memahami regulasi, prosedur, dan persyaratan pengujian kendaraan bermotor (KIR) berdasarkan peraturan perundang-undangan yang berlaku di Indonesia.

Panduan menjawab:
- Gunakan bahasa Indonesia yang formal namun mudah dipahami
- Sebutkan dasar hukum jika relevan (UU LLAJ, PM Perhubungan, dll)
- Jika pertanyaan di luar konteks KIR/pengujian kendaraan, tolak dengan sopan
- Berikan jawaban yang akurat, ringkas, dan terstruktur`;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/chat', async (req, res) => {
  const { conversation } = req.body;

  try {
    if (!Array.isArray(conversation)) {
      throw new Error('Messages harus berupa array!');
    }

    const contents = conversation.map(({ role, text }) => ({
      role,
      parts: [{ text }],
    }));

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents,
      config: {
        temperature: 0.3,
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });

    res.status(200).json({ result: response.text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`KIR Chatbot berjalan di http://localhost:${PORT}`);
});

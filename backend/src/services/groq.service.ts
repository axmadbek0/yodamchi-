import dotenv from 'dotenv';
import path from 'path';

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') });
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Groq AI Client Service
 * Yuqori tezlikdagi LPU inference, multi-key avtomatik fallback va nosozliklarga bardoshli arxitektura.
 */

export interface GroqChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GroqCompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemInstruction?: string;
}

export interface GroqHealthStatus {
  ok: boolean;
  activeKeyMasked: string;
  activeKeyIndex: number;
  primaryModel: string;
  totalKeysConfigured: number;
}

class GroqService {
  private readonly keys: string[] = [];
  private activeKeyIndex: number = 0;
  private readonly defaultModel: string;
  private readonly fallbackModel: string;
  private readonly apiEndpoint = 'https://api.groq.com/openai/v1/chat/completions';

  constructor() {
    // 1-va 2-darajali kalitlar
    const primaryKey = (process.env.GROQ_API_KEY || '').trim();
    const fallbackKey = (process.env.GROQ_API_KEY_FALLBACK || '').trim();

    if (primaryKey) this.keys.push(primaryKey.trim());
    if (fallbackKey && fallbackKey.trim() !== primaryKey.trim()) {
      this.keys.push(fallbackKey.trim());
    }

    this.defaultModel = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
    this.fallbackModel = process.env.GROQ_FALLBACK_MODEL || 'openai/gpt-oss-20b';

    console.log(`[Groq AI] Servis ishga tushirildi. Konfiguratsiya qilingan kalitlar soni: ${this.keys.length}`);
  }

  /**
   * Joriy faol kalitni olish
   */
  private getActiveKey(): string | null {
    if (this.keys.length === 0) return null;
    return this.keys[this.activeKeyIndex % this.keys.length];
  }

  /**
   * Kalitda xatolik yuz berganda keyingi kalitga o'tish
   */
  private rotateToNextKey(): void {
    if (this.keys.length <= 1) return;
    const prev = this.activeKeyIndex;
    this.activeKeyIndex = (this.activeKeyIndex + 1) % this.keys.length;
    console.warn(`[Groq AI] Kalit almashtirildi: #${prev + 1} -> #${this.activeKeyIndex + 1}`);
  }

  /**
   * Kalitni xavfsiz ko'rinishda niqoblash (loglar uchun)
   */
  private maskKey(key: string): string {
    if (!key || key.length < 10) return '***';
    return `${key.slice(0, 7)}...${key.slice(-4)}`;
  }

  /**
   * Asosiy matn yaratish (Chat Completion) so'rovi
   * Avtomatik kalit almashtirish (failover) va model fallback bilan.
   */
  public async generateCompletion(
    messages: GroqChatMessage[],
    options: GroqCompletionOptions = {}
  ): Promise<string | null> {
    if (this.keys.length === 0) {
      console.warn('[Groq AI] Kalitlar topilmadi');
      return null;
    }

    const systemMsg = options.systemInstruction
      ? [{ role: 'system' as const, content: options.systemInstruction }]
      : [];

    const fullMessages = [...systemMsg, ...messages];
    const initialKeyIndex = this.activeKeyIndex;
    const maxAttempts = this.keys.length * 2; // Har bir kalit + fallback model

    let attempt = 0;
    while (attempt < maxAttempts) {
      const currentKey = this.getActiveKey();
      if (!currentKey) break;

      const modelToUse = attempt >= this.keys.length ? this.fallbackModel : (options.model || this.defaultModel);

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 18000); // 18s timeout

        const response = await fetch(this.apiEndpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${currentKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: modelToUse,
            messages: fullMessages,
            temperature: options.temperature ?? 0.6,
            max_tokens: options.maxTokens ?? 1024,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = (await response.json()) as {
            choices?: Array<{ message?: { content?: string } }>;
          };
          const content = data?.choices?.[0]?.message?.content?.trim();
          if (content) {
            return content;
          }
        }

        // Agar 429 (RateLimit), 401 (Unauthorized), 403 (Quota), yoki 5xx xatolik bo'lsa
        const errText = await response.text().catch(() => '');
        console.warn(
          `[Groq AI] So'rov xatosi (Status: ${response.status}, Kalit: ${this.maskKey(currentKey)}, Model: ${modelToUse}):`,
          errText.slice(0, 200)
        );

        // Keyingi kalitga o'tish
        this.rotateToNextKey();
        attempt++;
      } catch (err: any) {
        console.warn(
          `[Groq AI] Tarmoq yoki ulanish xatosi (Kalit: ${this.maskKey(currentKey)}):`,
          err?.message || err
        );
        this.rotateToNextKey();
        attempt++;
      }
    }

    console.error('[Groq AI] Barcha kalitlar va modellarga so\'rov muvaffaqiyatsiz bo\'ldi.');
    return null;
  }

  /**
   * Maxsus pedagogika bo'yicha kunlik hisobot tahlili
   */
  public async analyzeStudentDailyLog(input: {
    studentName: string;
    mood: string;
    health: string;
    logText: string;
  }): Promise<string | null> {
    const systemPrompt = `
Siz imkoniyati cheklangan (aqli zaif, Daun sindromi, autizm) bolalar bilan ishlaydigan
professional maktab-internati bolalar psixologi va oliy toifali pedagogisiz.
Ota-onalarga farzandining holatiga mos iliq, xavotirsiz va rag'batlantiruvchi yo'l-yo'riq berasiz.
Tibbiy tashxis qo'ymaysiz va ota-onani asabiylashtiradigan so'zlardan qochasiz.
    `.trim();

    const userPrompt = `
O'quvchi ismi: ${input.studentName}
Bugungi kayfiyat: ${input.mood}
Salomatlik holati: ${input.health}
O'qituvchi kunlik izohi: "${input.logText}"

Vazifa: Ushbu matnni maxsus ta'lim maktabidagi o'quvchining holati sifatida tahlil qilib,
ota-ona tushunadigan qisqa xulosa yoz.

Talablar:
1. O'zbek tilida (lotin yozuvida), yumshoq va dalda beruvchi ohangda yoz.
2. 3-4 gapdan oshmasin.
3. Bolaning kuchli tomonlarini ta'kidlang, ota-onaga bitta amaliy uy mashg'uloti tavsiya qiling.
4. "Muammo", "kasallik" kabi qo'rqinchli so'zlardan qoching.
    `.trim();

    return this.generateCompletion(
      [{ role: 'user', content: userPrompt }],
      { systemInstruction: systemPrompt, temperature: 0.5 }
    );
  }

  /**
   * Ota-onalar uchun maxsus pedagogik maslahat chat
   */
  public async chatSpecialPedagogy(input: {
    message: string;
    studentName?: string;
    studentClass?: string;
    history?: Array<{ role: string; parts?: Array<{ text: string }> }>;
  }): Promise<string | null> {
    const systemPrompt = `
Siz "Yordamchi med" platformasining maxsus pedagogika va inklyuziv ta'lim bo'yicha AI maslahatchisiz.
Siz bilan muloqot qilayotgan shaxs — ${input.studentName || 'bola'} ota-onasi (sinf: ${input.studentClass || 'maxsus guruh'}).
O'zbek tilida (lotin), samimiy, mutaxassis sifatida muloyim va aniq javob bering (2-3 xatboshi).
Uy sharoitida ota-ona bajarishi mumkin bo'lgan yordamchi amaliy tavsiyalar bering.
Tibbiy dorilar tayinlamang; zarur hollarda shifokor yoki tor mutaxassis bilan maslahatlashishni tavsiya qiling.
    `.trim();

    const messages: GroqChatMessage[] = [];
    if (input.history && Array.isArray(input.history)) {
      for (const h of input.history) {
        const text = h.parts?.[0]?.text || '';
        if (text) {
          messages.push({
            role: h.role === 'model' || h.role === 'assistant' ? 'assistant' : 'user',
            content: text,
          });
        }
      }
    }

    messages.push({ role: 'user', content: input.message });

    return this.generateCompletion(messages, {
      systemInstruction: systemPrompt,
      temperature: 0.6,
    });
  }

  /**
   * Xizmat holatini tekshirish (Health Status)
   */
  public getHealth(): GroqHealthStatus {
    const currentKey = this.getActiveKey();
    return {
      ok: this.keys.length > 0,
      activeKeyMasked: currentKey ? this.maskKey(currentKey) : 'none',
      activeKeyIndex: this.activeKeyIndex + 1,
      primaryModel: this.defaultModel,
      totalKeysConfigured: this.keys.length,
    };
  }
}

export const groqService = new GroqService();


import { GoogleGenAI, Type, Modality } from "@google/genai";
import { MCQ, HadithResult, AppLanguage, ScheduleItem, AspectRatio, ImageSize } from "../types";

// Always initialize the client with the API key from environment variables.
// Note: For Veo/Pro features, the key will be injected from window.aistudio state in the component
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const checkOnline = () => navigator.onLine;

// --- UTILITY: Base64 helpers ---
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result.split(',')[1]);
      } else {
        reject(new Error("Failed to convert blob to base64"));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// --- VALIDATION ---
export const validateLocation = async (location: string): Promise<boolean> => {
  if (!checkOnline()) return true; 
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Is "${location}" a real and recognizable city and country? Answer ONLY with 'true' or 'false'.`,
    });
    return response.text?.toLowerCase().trim().includes("true") ?? false;
  } catch (error) {
    console.error("Location validation error:", error);
    return true; 
  }
};

// --- SCHEDULE & CONTENT ---
export const generateDailySchedule = async (userPrompt: string, language: AppLanguage = 'English'): Promise<ScheduleItem[] | null> => {
  if (!checkOnline()) return null;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Create a comprehensive daily schedule for a user based on this request: "${userPrompt}". 
      Requirements: 1. Return exactly 5-8 major categories. 2. Use varied icons. 3. Language: ${language}.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.INTEGER },
              title: { type: Type.STRING },
              time: { type: Type.STRING },
              icon: { type: Type.STRING },
              color: { type: Type.STRING },
              bg: { type: Type.STRING },
              subtasks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: { text: { type: Type.STRING }, completed: { type: Type.BOOLEAN } },
                  required: ["text", "completed"]
                }
              }
            },
            required: ["id", "title", "time", "icon", "color", "bg", "subtasks"]
          }
        }
      }
    });
    return JSON.parse(response.text.trim()) as ScheduleItem[];
  } catch (error) {
    console.error("Error generating schedule:", error);
    return null;
  }
};

export const generateDailySuggestions = async (profile: any, schedule: ScheduleItem[], language: AppLanguage = 'English'): Promise<string[] | null> => {
  if (!checkOnline()) return null;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Based on user ${profile?.name} from ${profile?.location} and schedule: ${schedule.map(s => s.title).join(', ')}, provide 3 unique suggestions in ${language}.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
      }
    });
    return JSON.parse(response.text.trim()) as string[];
  } catch (error) { return null; }
};

export const generateCategorySubtasks = async (categoryTitle: string, language: AppLanguage = 'English'): Promise<string[] | null> => {
  if (!checkOnline()) return null;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Suggest 5 subtasks for category: "${categoryTitle}" in ${language}.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
      }
    });
    return JSON.parse(response.text.trim()) as string[];
  } catch (error) { return null; }
};

export const generateMCQ = async (topic: string, language: AppLanguage = 'English'): Promise<MCQ | null> => {
  if (!checkOnline()) return null;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate 1 educational MCQ about "${topic}" in ${language}.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: { q: { type: Type.STRING }, options: { type: Type.ARRAY, items: { type: Type.STRING } }, ans: { type: Type.INTEGER } },
          required: ["q", "options", "ans"]
        }
      }
    });
    return JSON.parse(response.text.trim()) as MCQ;
  } catch (error) { return null; }
};

export const searchHadith = async (query: string, language: AppLanguage = 'English'): Promise<HadithResult | null> => {
  if (!checkOnline()) return null;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Search for authentic Hadith regarding: "${query}" in ${language}. Provide Arabic and translation.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: { arabic: { type: Type.STRING }, translation: { type: Type.STRING }, reference: { type: Type.STRING }, explanation: { type: Type.STRING } },
          required: ["arabic", "translation", "reference", "explanation"]
        }
      }
    });
    return JSON.parse(response.text.trim()) as HadithResult;
  } catch (error) { return null; }
};

export const exploreHistory = async (era: string, language: AppLanguage = 'English'): Promise<string | null> => {
  if (!checkOnline()) return null;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Provide summary of history: "${era}" in ${language}.`,
    });
    return response.text;
  } catch (error) { return null; }
};

export const generateStrategy = async (topic: string, language: AppLanguage = 'English'): Promise<string[] | null> => {
  if (!checkOnline()) return null;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Provide 5 study strategy steps for: "${topic}" in ${language}.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
      }
    });
    return JSON.parse(response.text.trim()) as string[];
  } catch (error) { return null; }
};

// --- NEW ADVANCED AI FEATURES ---

// 1. Chat with Grounding (Search or Maps)
export const chatWithGemini = async (prompt: string, tool: 'search' | 'maps' | 'none', language: string): Promise<string> => {
  try {
    const tools = [];
    let model = 'gemini-3-pro-preview'; // Default smart model

    if (tool === 'search') {
      tools.push({ googleSearch: {} });
      model = 'gemini-3-flash-preview'; // Flash for speed with search
    } else if (tool === 'maps') {
      tools.push({ googleMaps: {} });
      model = 'gemini-2.5-flash'; // Maps supported on 2.5 Flash
    }

    const response = await ai.models.generateContent({
      model: model,
      contents: `Answer the following in ${language}: ${prompt}`,
      config: { tools: tools.length > 0 ? tools : undefined }
    });
    return response.text || "No response generated.";
  } catch (e: any) {
    return `Error: ${e.message}`;
  }
};

// 2. Generate Image (Nano Banana Pro)
export const generateImage = async (prompt: string, size: ImageSize, ratio: AspectRatio): Promise<string | null> => {
  // Note: Caller must ensure window.aistudio.hasSelectedApiKey() is true before calling this
  try {
    // Re-init with selected key to be safe, though environment variable is injected
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: {
          aspectRatio: ratio,
          imageSize: size
        }
      }
    });
    
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (e) {
    console.error("Image gen error", e);
    return null;
  }
};

// 3. Edit Image (Gemini 2.5 Flash Image)
export const editImage = async (imageBlob: Blob, prompt: string): Promise<string | null> => {
  try {
    const base64Data = await blobToBase64(imageBlob);
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { mimeType: imageBlob.type, data: base64Data } },
          { text: prompt }
        ]
      }
    });
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (e) {
    console.error("Image edit error", e);
    return null;
  }
};

// 4. Generate Video (Veo)
export const generateVideo = async (prompt: string, aspectRatio: '16:9' | '9:16', imageBlob?: Blob): Promise<string | null> => {
  // Note: Caller must ensure window.aistudio.hasSelectedApiKey() is true
  try {
    let request: any = {
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: aspectRatio
      }
    };

    if (imageBlob) {
      const base64Data = await blobToBase64(imageBlob);
      request.image = { imageBytes: base64Data, mimeType: imageBlob.type };
    }

    let operation = await ai.models.generateVideos(request);

    // Polling
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (downloadLink) {
        // Must append key for download
        return `${downloadLink}&key=${process.env.API_KEY}`;
    }
    return null;
  } catch (e) {
    console.error("Video gen error", e);
    return null;
  }
};

// 5. Analyze Media (Image/Video Understanding)
export const analyzeMedia = async (file: File, prompt: string, language: string): Promise<string> => {
  try {
    const base64Data = await blobToBase64(file);
    const model = file.type.startsWith('video') ? 'gemini-3-pro-preview' : 'gemini-3-pro-preview';
    
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          { inlineData: { mimeType: file.type, data: base64Data } },
          { text: `${prompt} (Respond in ${language})` }
        ]
      }
    });
    return response.text || "Could not analyze.";
  } catch (e: any) {
    return `Analysis error: ${e.message}`;
  }
};

// 6. Transcribe Audio
export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
    try {
        const base64Data = await blobToBase64(audioBlob);
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: {
                parts: [
                    { inlineData: { mimeType: audioBlob.type || 'audio/wav', data: base64Data } },
                    { text: "Transcribe this audio exactly." }
                ]
            }
        });
        return response.text || "Transcription failed.";
    } catch (e: any) {
        return `Error: ${e.message}`;
    }
}

// 7. TTS
export const generateSpeech = async (text: string): Promise<ArrayBuffer | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
        },
      },
    });
    const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64) {
        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    }
    return null;
  } catch (e) {
    console.error("TTS error", e);
    return null;
  }
}

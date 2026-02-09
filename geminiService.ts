
import { GoogleGenAI, Modality } from "@google/genai";
import { TEXT_MODEL, IMAGE_MODEL, SYSTEM_INSTRUCTION, CODING_INSTRUCTION, ROLE_INSTRUCTIONS } from "../constants";
import { ChatMessage, GeminiResponse, ImageResponse } from "../types";
import { UserProfile } from "./storageService";

const getDynamicSystemInstruction = (profile: UserProfile | null, isCoding: boolean) => {
  let base = isCoding ? CODING_INSTRUCTION : SYSTEM_INSTRUCTION;
  
  if (profile) {
    const roleKey = profile.role as keyof typeof ROLE_INSTRUCTIONS;
    const roleBonus = ROLE_INSTRUCTIONS[roleKey] || "";
    
    base += `\n\nUSER IDENTITY: ${profile.fullName}. ${profile.goal ? `Current Mission: ${profile.goal}.` : ''}`;
    base += `\n\n${roleBonus}`;
    
    if (profile.personalization) {
      base += `\n\nUSER'S SUPREME PERSONALIZATION LAW: ${profile.personalization}. Obey this strictly above all else.`;
    }
  }
  
  return base;
};

export const sendMessageToGemini = async (
  history: ChatMessage[],
  profile: UserProfile | null,
  isCodingMode: boolean = false
): Promise<GeminiResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const contents = history.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.text }]
  }));

  try {
    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents,
      config: {
        systemInstruction: getDynamicSystemInstruction(profile, isCodingMode),
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "Yo, I couldn't process that properly. Rephrase it for me!";
    
    const groundingUrls: string[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web?.uri) groundingUrls.push(chunk.web.uri);
      });
    }

    return {
      text,
      groundingUrls: Array.from(new Set(groundingUrls))
    };
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Failed to connect to the AI brain.");
  }
};

export const generateChatTitle = async (firstMessage: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: `Suggest a very short (max 4 words), catchy, high-energy title for a chat that starts with this message: "${firstMessage}". Return only the title text, nothing else.`,
      config: { temperature: 0.7 }
    });
    return response.text?.trim().replace(/"/g, '') || "New Mission";
  } catch (e) {
    return "New Mission";
  }
};

export const generateImageWithGemini = async (prompt: string, aspectRatio: string = "1:1"): Promise<ImageResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: IMAGE_MODEL,
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as any
        }
      }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return {
          imageUrl: `data:image/png;base64,${part.inlineData.data}`,
          prompt
        };
      }
    }
    throw new Error("No image data returned from model.");
  } catch (error: any) {
    console.error("Image Generation Error:", error);
    throw new Error(error.message || "Failed to imagine the visual.");
  }
};

export const editImageWithGemini = async (images: {base64: string, mimeType: string}[], prompt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const imageParts = images.map(img => ({
    inlineData: { data: img.base64, mimeType: img.mimeType }
  }));

  const response = await ai.models.generateContent({
    model: IMAGE_MODEL,
    contents: {
      parts: [
        ...imageParts,
        { text: prompt },
      ],
    },
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("Failed to edit image.");
};

export const analyzeMediaWithGemini = async (images: {base64: string, mimeType: string}[], prompt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const mediaParts = images.map(img => ({
    inlineData: { data: img.base64, mimeType: img.mimeType }
  }));

  const response = await ai.models.generateContent({
    model: TEXT_MODEL,
    contents: {
      parts: [
        ...mediaParts,
        { text: prompt },
      ],
    },
  });
  return response.text || "I couldn't analyze that.";
};

export const generateVideoWithVeo = async (prompt: string, aspectRatio: string = '16:9'): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt,
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: aspectRatio as any
    }
  });

  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!downloadLink) throw new Error("Video generation failed.");
  
  const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
  const blob = await response.blob();
  return URL.createObjectURL(blob);
};

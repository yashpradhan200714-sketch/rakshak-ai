
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { SYSTEM_INSTRUCTION, ASSISTANT_SYSTEM_INSTRUCTION } from "../constants";
import { ChatMessage, EmergencyType } from "../types";

let aiClient: GoogleGenAI | null = null;

const getClient = () => {
  // Always use the latest API_KEY from environment
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

const shortEmergencySchema = {
  type: Type.OBJECT,
  properties: {
    command: {
      type: Type.STRING,
      description: "Professional medical or tactical command (max 8 words)."
    },
    context: {
      type: Type.STRING,
      description: "Immediate safety context (max 4 words)."
    },
    emergencyType: {
      type: Type.STRING,
      enum: ["Medical", "Accident", "Fire", "Harassment", "Disaster", "Uncertain"],
      description: "Category."
    },
    severity: {
      type: Type.STRING,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      description: "Threat level."
    }
  },
  required: ["command", "context", "emergencyType", "severity"]
};

export interface AIResponse {
  text: string;
  type: EmergencyType;
  severity: string;
  command?: string;
  groundingMetadata?: any;
}

export const generateEmergencyResponse = async (
  history: ChatMessage[],
  newMessage: string
): Promise<AIResponse> => {
  try {
    const client = getClient();
    const conversationHistory = history.map(msg => 
      `${msg.sender === 'user' ? 'User' : 'Rakshak AI'}: ${msg.text}`
    ).slice(-4).join('\n');

    const prompt = `${conversationHistory}\nUser: ${newMessage}\nRakshak AI: PROFESSIONAL DIRECTIVE NOW.`;

    const response = await client.models.generateContent({
      model: 'gemini-3-pro-preview', 
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        maxOutputTokens: 200,
        temperature: 0,
        responseMimeType: "application/json",
        responseSchema: shortEmergencySchema
      }
    });

    const data = JSON.parse(response.text || "{}");
    
    return {
      text: `${data.command.toUpperCase()}. ${data.context.toUpperCase()}`,
      command: data.command,
      type: (data.emergencyType as EmergencyType) || EmergencyType.UNCERTAIN,
      severity: data.severity || "MEDIUM"
    };

  } catch (error) {
    console.error("AI Error:", error);
    return {
      text: "MAINTAIN CURRENT POSITION. RAKSHAK AI IS COORDINATING ASSISTANCE.",
      type: EmergencyType.UNCERTAIN,
      severity: "CRITICAL"
    };
  }
};

export const analyzeImage = async (
    base64Image: string,
    mimeType: string,
    prompt: string = "Analyze visual field for immediate life threats. Identify injuries, fire sources, or human threats. Provide professional tactical directives."
): Promise<AIResponse> => {
    try {
        const client = getClient();
        const response = await client.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: {
                parts: [
                    { inlineData: { data: base64Image, mimeType } },
                    { text: prompt }
                ]
            },
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                responseMimeType: "application/json",
                responseSchema: shortEmergencySchema
            }
        });

        const data = JSON.parse(response.text || "{}");
        return {
            text: `${data.command.toUpperCase()}. ${data.context.toUpperCase()}`,
            type: (data.emergencyType as EmergencyType) || EmergencyType.UNCERTAIN,
            severity: data.severity || "MEDIUM"
        };
    } catch (e) {
        console.error("Vision AI Error:", e);
        return {
            text: "VISUAL ANALYSIS SUSPENDED. DESCRIBE HAZARD VERBALLY TO RAKSHAK AI.",
            type: EmergencyType.UNCERTAIN,
            severity: "HIGH"
        };
    }
};

export const generateSpeech = async (text: string): Promise<ArrayBuffer | null> => {
    try {
        const client = getClient();
        const response = await client.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Zephyr' },
                    },
                },
            },
        });
        
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64Audio) {
             const decode = (base64: string) => {
               const binaryString = atob(base64);
               const len = binaryString.length;
               const bytes = new Uint8Array(len);
               for (let i = 0; i < len; i++) {
                 bytes[i] = binaryString.charCodeAt(i);
               }
               return bytes;
             };
             return decode(base64Audio).buffer;
        }
        return null;
    } catch (e) {
        console.error("TTS Error", e);
        return null;
    }
};

export const generateAssistantResponse = async (
    newMessage: string,
    mode: 'chat' | 'maps',
    location?: { lat: number; lng: number }
): Promise<{ text: string; groundingMetadata?: any }> => {
    try {
        const client = getClient();
        // Use gemini-2.5-flash for maps grounding as per task instructions
        const model = 'gemini-2.5-flash';
        let tools: any[] | undefined = undefined;
        let toolConfig: any = undefined;

        if (mode === 'maps') {
            tools = [{ googleMaps: {} }];
            if (location) {
                toolConfig = {
                    retrievalConfig: {
                        latLng: {
                            latitude: location.lat,
                            longitude: location.lng
                        }
                    }
                };
            }
        }

        const response = await client.models.generateContent({
            model,
            contents: newMessage,
            config: {
                systemInstruction: ASSISTANT_SYSTEM_INSTRUCTION,
                tools,
                toolConfig,
                thinkingConfig: { thinkingBudget: 0 }
            }
        });

        return {
            text: response.text || "Synchronizing Rakshak AI with regional safety layers...",
            groundingMetadata: response.candidates?.[0]?.groundingMetadata
        };

    } catch (error) {
        console.error("Assistant Error:", error);
        return { text: "Intelligence synchronization failure. Rakshak AI suggests confirming device connectivity." };
    }
};

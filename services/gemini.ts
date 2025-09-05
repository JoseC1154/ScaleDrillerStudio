import { GoogleGenAI, Type } from "@google/genai";
import { UserChord, SuggestedChord, Note, ChordTypeName } from "../types";
import { CHORD_TYPE_NAMES, ALL_NOTES } from "../constants";

// It's crucial to assume process.env.API_KEY is available in the execution environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const responseSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            name: {
                type: Type.STRING,
                description: "The full common name of the chord, e.g., 'G7', 'Am7', 'Fmaj7'."
            },
            root: {
                type: Type.STRING,
                description: "The root note of the chord.",
                enum: ALL_NOTES as string[],
            },
            type: {
                type: Type.STRING,
                description: "The type of the chord from the provided list.",
                enum: CHORD_TYPE_NAMES as string[],
            }
        },
        required: ["name", "root", "type"],
    },
    description: "A list of exactly 4 suggested chords forming a progression."
};

export const suggestChordProgression = async (
    existingChords: UserChord[],
    style: string = 'common pop/jazz'
): Promise<SuggestedChord[]> => {
    
    const existingChordNames = existingChords.length > 0 ? existingChords.map(c => c.name).join(', ') : "any common starting chord like C Major";
    const prompt = `
        Given the following chord(s) as a starting point: ${existingChordNames}.
        Suggest a musically coherent and interesting 4-chord progression in a ${style} style that could logically follow or include these chords.
        The goal is to create a fresh progression, so try not to simply repeat the provided chords unless it is musically essential for a very common cadence (like a V-I).
        Return a JSON array of exactly 4 chord objects for the final progression.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                temperature: 0.9, // A bit higher for more creative suggestions
            }
        });

        const jsonText = response.text.trim();
        if (!jsonText) {
            throw new Error("Received an empty response from the AI.");
        }
        const suggestions = JSON.parse(jsonText) as SuggestedChord[];
        
        if (!Array.isArray(suggestions) || suggestions.length === 0) {
            console.warn("Gemini response was not a valid array:", suggestions);
            throw new Error("Invalid response format from Gemini API.");
        }
        
        // Ensure the output is exactly 4 chords, truncate or pad if necessary (though schema should prevent this)
        return suggestions.slice(0, 4);

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        if (error instanceof Error && error.message.includes('API key')) {
             throw new Error("The Gemini API key is invalid or missing. Please ensure it is configured correctly.");
        }
        throw new Error("Failed to get chord suggestions from the AI. The service may be temporarily unavailable.");
    }
};
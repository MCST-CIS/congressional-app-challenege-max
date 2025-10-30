'use server';
/**
 * @fileOverview A simple flow to test the Gemini API key.
 *
 * - testGemini - A function that calls the Gemini model with a simple prompt.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export async function testGemini(prompt: string): Promise<string> {
  return testGeminiFlow(prompt);
}

const testGeminiFlow = ai.defineFlow(
  {
    name: 'testGeminiFlow',
    inputSchema: z.string(),
    outputSchema: z.string(),
  },
  async (prompt) => {
    try {
      const {text} = await ai.generate({
          prompt: prompt,
      });
      return text;
    } catch (e: any) {
        console.error("Gemini API call failed:", e);
        return `Error: API call failed. Check the server logs and ensure your GEMINI_API_KEY is correct. Message: ${e.message}`;
    }
  }
);

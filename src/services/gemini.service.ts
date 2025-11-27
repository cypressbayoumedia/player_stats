import { Injectable } from '@angular/core';
import { GoogleGenAI } from '@google/genai';
import { PlayerStats } from '../models/player-stats.model';

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      // A user-facing error will be shown in the component if the API call fails.
      console.error('API_KEY environment variable not set.');
      throw new Error('API_KEY environment variable not set');
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  async getPlayerStats(playerName: string): Promise<PlayerStats | null> {
    const systemInstruction = `You are an expert sports data API. Your purpose is to retrieve and format NFL player statistics based on their most recent game. You must provide data in a specific JSON format. Accuracy is the highest priority, especially for player images.`;

    const prompt = `For the NFL player "${playerName}", find the statistics from their most recently completed official game, including the name of the opponent team.
    
You MUST use your search tool to find the most up-to-date, real-world information. This includes accurate player images.

When searching for images, prioritize official sources like ESPN, NFL.com, or team websites. For better compatibility, also check sources with permissive CORS policies like Wikimedia Commons or Wikipedia. The player image MUST be of the correct player. For example, if the player is Travis Kelce, the image must be of Travis Kelce of the Kansas City Chiefs.

Provide a comprehensive list of 8-10 of the most relevant and impactful stats for their position. For example:
- For a QB: Passing Yards, Touchdowns, Completions, Attempts, Interceptions, QBR.
- For a RB/WR: Rushing/Receiving Yards, Touchdowns, Receptions, Yards Per Carry/Reception.
- For Defensive players: Tackles, Sacks, Interceptions, Forced Fumbles.
- For a Kicker: Field Goals Made, Field Goals Attempted, Longest Field Goal.

You MUST include a 'selected' boolean field for each stat. Set 'selected' to 'true' for the 5-6 most important stats for the player's position, and 'false' for the rest. This provides a good default but allows the user to customize.

Return the data as a single, minified JSON object with NO surrounding text, markdown formatting (like \`\`\`json), or explanations.

The JSON object must have the following structure:
{
  "name": "Player's Full Name",
  "position": "Player's Position (e.g., QB)",
  "team": "Player's Current Team Name",
  "opponent": "The name of the opponent team from the most recent game.",
  "playerImageUrl": "A direct HTTPS URL to a recent, high-quality headshot of the player. VERIFY that the image is actually of '${playerName}'. Do not provide an image of a different player.",
  "stats": [
    { "key": "STAT_NAME_1", "value": "STAT_VALUE_1", "selected": true },
    { "key": "STAT_NAME_2", "value": "STAT_VALUE_2", "selected": false }
  ]
}

CRITICAL: All URLs must be direct links to the image file (e.g., ending in .png, .jpg, .webp) and must be publicly accessible to avoid CORS issues. Do not link to web pages. For the playerImageUrl, do not use Fandom/Wikia URLs as they often block direct access.`;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction,
          tools: [{ googleSearch: {} }],
        },
      });

      // Find the start and end of the JSON object in the response.
      const text = response.text;
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const jsonString = text.substring(jsonStart, jsonEnd + 1);
        const statsData = JSON.parse(jsonString);
        return statsData as PlayerStats;
      } else {
         throw new Error("No valid JSON object found in the response.");
      }

    } catch (error) {
      console.error('Error calling Gemini API or parsing response:', error);
      // Try to parse a more specific error from the user prompt
      if (error instanceof Error && error.message.includes('not valid JSON')) {
          throw new Error(`Unexpected token in API response. The API returned conversational text instead of JSON. Full response: ${error.message}`);
      }
      return null;
    }
  }
}
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

  async getPlayerStats(playerName: string, mode: 'weekly' | 'season', week?: number): Promise<PlayerStats | null> {
    const commonInstructions = `
You MUST use your search tool to find the most up-to-date, real-world information.

Provide a comprehensive list of 8-10 of the most relevant and impactful stats for their position. For example:
- For a QB: Passing Yards, Touchdowns, Completions, Attempts, Interceptions, QBR.
- For a RB/WR: Rushing/Receiving Yards, Touchdowns, Receptions, Yards Per Carry/Reception.
- For Defensive players: Tackles, Sacks, Interceptions, Forced Fumbles.
- For a Kicker: Field Goals Made, Field Goals Attempted, Longest Field Goal.

You MUST include a 'selected' boolean field for each stat. Set 'selected' to 'true' for the 5-6 most important stats for the player's position, and 'false' for the rest. This provides a good default but allows the user to customize.

Return the data as a single, minified JSON object with NO surrounding text, markdown formatting (like \`\`\`json), or explanations.`;

    const weeklyPrompt = `For the NFL player "${playerName}", find the statistics ${week ? `from Week ${week}` : `from their most recently completed official game`} of the current or most recent NFL season (e.g., the 2024-2025 season). You must also determine if the player was the official starter for that game.
    ${commonInstructions}
    The JSON object must have the following structure:
    {
      "name": "Player's Full Name",
      "position": "Player's Position (e.g., QB)",
      "team": "Player's Current Team Name",
      "opponent": "The name of the opponent team from that game.",
      "gameWeek": "The week number of the game (as a number).",
      "season": "The season year (e.g., '2024').",
      "statType": "weekly",
      "didStart": "A boolean value indicating if the player was the official starter for this game.",
      "stats": [
        { "key": "STAT_NAME_1", "value": "STAT_VALUE_1", "selected": true, "isHighlighted": false },
        { "key": "STAT_NAME_2", "value": "STAT_VALUE_2", "selected": false, "isHighlighted": false }
      ]
    }`;

    const seasonPrompt = `For the NFL player "${playerName}", find their total, aggregated statistics for the current or most recent NFL season (e.g., the 2024-2025 season).
    ${commonInstructions}
    The JSON object must have the following structure:
    {
      "name": "Player's Full Name",
      "position": "Player's Position (e.g., QB)",
      "team": "Player's Current Team Name",
      "season": "The season year (e.g., '2024').",
      "statType": "season",
      "stats": [
        { "key": "STAT_NAME_1", "value": "STAT_VALUE_1", "selected": true, "isHighlighted": false },
        { "key": "STAT_NAME_2", "value": "STAT_VALUE_2", "selected": false, "isHighlighted": false }
      ]
    }`;

    const prompt = (mode === 'season' ? seasonPrompt : weeklyPrompt);

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          role: 'user',
          parts: [{text: prompt}]
        },
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const text = response.text;
      if (!text) {
        throw new Error("API returned an empty response.");
      }
      
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
      if (error instanceof Error && error.message.includes('not valid JSON')) {
          throw new Error(`Unexpected token in API response. The API returned conversational text instead of JSON. Full response: ${error.message}`);
      }
      return null;
    }
  }

  async getRandomPlayerName(): Promise<string> {
    const prompt = `From the following list of superstar NFL players, please select one name at random and return only that name as a string, with no additional text or explanation.

List of Players:
- Tom Brady
- Patrick Mahomes
- Aaron Rodgers
- Justin Jefferson
- Ja'Marr Chase
- Travis Kelce
- George Kittle
- Christian McCaffrey
- Derrick Henry
- Myles Garrett
- T.J. Watt
- Aaron Donald
- Lamar Jackson
- Joe Burrow
- Josh Allen
- CeeDee Lamb
- Tyreek Hill
- Micah Parsons`;

    try {
        const response = await this.ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text.trim();
    } catch (error) {
        console.error('Error fetching random player name:', error);
        // Fallback to a default name if the API fails
        return 'Patrick Mahomes';
    }
  }
}
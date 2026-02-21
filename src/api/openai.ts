const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

/**
 * Transform plain navigation instructions into pirate-themed riddles using OpenAI.
 * Uses gpt-4o-mini for low cost.
 */
export async function pirateifyInstructions(
    instructions: string[],
    apiKey: string,
): Promise<string[]> {
    const numbered = instructions
        .map((instr, i) => `${i + 1}. ${instr}`)
        .join('\n');

    const systemPrompt = `You are a pirate captain giving treasure hunt clues to yer crew on a university campus. 
Transform each navigation instruction into a short, fun pirate-themed riddle or clue. 

Rules:
- Keep each clue to 1-2 sentences maximum
- The clue must still clearly convey the actual direction (left, right, forward, distance, etc.)
- Use pirate language (ye, matey, starboard for right, port for left, paces for meters, etc.)
- Make them playful and treasure-hunt-y
- Return ONLY the numbered list, one clue per line, same numbering as input
- Do NOT add any extra text before or after the list`;

    const userPrompt = `Transform these navigation instructions into pirate clues:\n\n${numbered}`;

    const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            temperature: 0.8,
            max_tokens: 1024,
        }),
    });

    if (!response.ok) {
        const errBody = await response.text();
        console.error('OpenAI API error:', response.status, errBody);
        throw new Error(`OpenAI API returned ${response.status}`);
    }

    const data = await response.json();
    const content: string = data.choices?.[0]?.message?.content ?? '';

    // Parse the numbered list back into an array
    const lines = content
        .split('\n')
        .map((line: string) => line.replace(/^\d+\.\s*/, '').trim())
        .filter((line: string) => line.length > 0);

    // If parsing failed or counts don't match, return originals
    if (lines.length !== instructions.length) {
        console.warn('AI returned unexpected number of lines, falling back to originals');
        return instructions;
    }

    return lines;
}

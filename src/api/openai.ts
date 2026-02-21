const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export type Difficulty = 'easy' | 'normal' | 'hard';

const DIFFICULTY_PROMPTS: Record<Difficulty, string> = {
    easy: `You are a friendly pirate captain giving treasure hunt clues to yer crew on a university campus. 
Transform each navigation instruction into a short, fun pirate-themed clue that is VERY easy to follow.

Rules:
- Keep each clue to 1-2 sentences maximum
- Be VERY direct and clear — state exact directions (left, right, forward, etc.) using pirate words
- Use pirate language (ye, matey, starboard for right, port for left, paces for meters, etc.)
- The clue should feel like a fun pirate instruction, not a riddle — anyone should understand it immediately
- Return ONLY the numbered list, one clue per line, same numbering as input
- Do NOT add any extra text before or after the list`,

    normal: `You are a pirate captain giving treasure hunt clues to yer crew on a university campus. 
Transform each navigation instruction into a short, fun pirate-themed riddle or clue. 

Rules:
- Keep each clue to 1-2 sentences maximum
- The clue must still clearly convey the actual direction (left, right, forward, distance, etc.)
- Use pirate language (ye, matey, starboard for right, port for left, paces for meters, etc.)
- Make them playful and treasure-hunt-y
- Return ONLY the numbered list, one clue per line, same numbering as input
- Do NOT add any extra text before or after the list`,

    hard: `You are a mysterious and cryptic pirate captain giving treasure hunt riddles to yer crew on a university campus.
Transform each navigation instruction into a CRYPTIC, mysterious pirate riddle that requires real thought to decode.

Rules:
- Keep each clue to 1-3 sentences maximum
- NEVER directly say left, right, forward, or distances — instead use metaphors, references to compass directions, landmarks, stars, sea mythology, etc.
- Use rich pirate language and poetic phrasing
- Each riddle should feel like a genuine puzzle — the solver must THINK to figure out the direction
- You may reference pirate lore, sea legends, constellations, and nautical metaphors
- Make it feel like deciphering an ancient treasure map
- Return ONLY the numbered list, one clue per line, same numbering as input
- Do NOT add any extra text before or after the list`,
};

/**
 * Transform plain navigation instructions into pirate-themed riddles using OpenAI.
 * Uses gpt-4o-mini for low cost.
 */
export async function pirateifyInstructions(
    instructions: string[],
    apiKey: string,
    difficulty: Difficulty = 'normal',
): Promise<string[]> {
    const numbered = instructions
        .map((instr, i) => `${i + 1}. ${instr}`)
        .join('\n');

    const systemPrompt = DIFFICULTY_PROMPTS[difficulty];

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

const OPENAI_TTS_URL = 'https://api.openai.com/v1/audio/speech';

export interface SpeechHandle {
    /** Stop playback and clean up */
    stop: () => void;
    /** Resolves when playback finishes naturally or is stopped */
    done: Promise<void>;
}

/**
 * Speak the given text using OpenAI TTS with a pirate-ish voice.
 * Returns a handle to stop playback.
 */
export function speakClue(text: string, apiKey: string): SpeechHandle {
    const controller = new AbortController();
    let audio: HTMLAudioElement | null = null;
    let objectUrl: string | null = null;

    const done = (async () => {
        const response = await fetch(OPENAI_TTS_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'tts-1',
                voice: 'fable',
                input: text,
                response_format: 'mp3',
            }),
            signal: controller.signal,
        });

        if (!response.ok) {
            const errBody = await response.text();
            console.error('OpenAI TTS error:', response.status, errBody);
            throw new Error(`OpenAI TTS returned ${response.status}`);
        }

        const blob = await response.blob();
        objectUrl = URL.createObjectURL(blob);
        audio = new Audio(objectUrl);

        await new Promise<void>((resolve, reject) => {
            audio!.onended = () => resolve();
            audio!.onerror = (e) => reject(e);
            audio!.play().catch(reject);
        });
    })().catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') {
            // Normal cancellation, ignore
            return;
        }
        console.warn('TTS playback error:', err);
    }).finally(() => {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
    });

    const stop = () => {
        controller.abort();
        if (audio) {
            audio.pause();
            audio.currentTime = 0;
        }
    };

    return { stop, done };
}

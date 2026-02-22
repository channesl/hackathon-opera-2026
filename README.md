# 🏴‍☠️ Campus Treasure Hunt

A pirate-themed treasure hunt app for Campus Valla at Linköping University. Search for two locations and get step-by-step navigation turned into fun pirate riddles by AI.

Built with React 18, TypeScript, Vite, MazeMap API, and OpenAI.

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Or create it manually with the following content:

```env
VITE_OPENAI_API_KEY=sk-your-openai-api-key-here
```

You can get an API key from [platform.openai.com/api-keys](https://platform.openai.com/api-keys). The app uses `gpt-4o-mini` which is very low-cost.

> **Note:** If no API key is provided the app still works — it just shows the original navigation instructions instead of pirate riddles.

### 3. Run in development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Build for production

```bash
npm run build
```

### Type check

```bash
npx tsc --noEmit
```

Done!
# One Click AI Question Solver

A mobile-friendly question-solving website with photo upload/camera capture, typed questions, subject selection, answer-style selection, and English/Kannada/Hindi output.

## Important
This is a starter project, not a hosted website. To generate real AI answers, you must run the server with an OpenAI API key. API usage may cost money. ChatGPT subscriptions and API billing are separate.

## Requirements
- Node.js 20 or newer
- An OpenAI API key from the OpenAI API platform
- Internet access while solving questions

## Run on your computer
1. Extract this ZIP.
2. Open a terminal in the extracted `one-click-ai-solver` folder.
3. Run `npm install`.
4. Set your API key as an environment variable. Do not paste it into `public/index.html` or commit it to a public repository.

   macOS/Linux:
   ```bash
   export OPENAI_API_KEY="your-api-key"
   npm start
   ```

   Windows PowerShell:
   ```powershell
   $env:OPENAI_API_KEY="your-api-key"
   npm start
   ```

5. Open `http://localhost:3000` in your browser.

Optional: set `OPENAI_MODEL` to a vision-capable model available in your API account. The default is `gpt-4.1-mini`.

## Publish online
Deploy this project to a Node.js hosting service that supports environment variables. Set `OPENAI_API_KEY` in the host's private environment settings, then deploy. Do not expose the key in browser JavaScript. Add authentication, stronger abuse controls, usage limits, and privacy disclosures before making the site public.

## How it works
The browser sends a question and optional image to `/api/solve`. The Express server calls the OpenAI Responses API and returns the answer. Images are held in memory for the request and are not saved to this project's disk by the app. The AI provider processes the submitted content to answer the question; review provider policies before handling sensitive information.

# Car Service Voice Agent

This project is a full-stack MERN application for a voice-first car service initial assessment assistant. A customer describes a vehicle problem by voice, and the system uses browser speech recognition, deterministic safety rules, a structured automotive knowledge base, explicit conversation state, and MongoDB persistence to ask relevant follow-up questions and record the assessment.

## What this project does

- Allows a customer to start a service assessment conversation
- Collects key customer and vehicle information over time
- Uses a safety-first assessment flow before mechanical suggestions
- Includes an optional Ollama/Qwen integration for model-backed conversational guidance
- Stores conversations and assessments in MongoDB
- Provides a clean React interface and Express API
- Uses browser SpeechRecognition for voice input and browser speechSynthesis for voice output

## Key features

- Voice-first conversation flow with browser STT/TTS
- Safety detection for urgent scenarios such as smoke, fire, brake failure, and severe overheating
- Knowledge-base guided symptom handling
- Structured deterministic responses with optional validated AI responses
- Assessment summary page
- MongoDB persistence for conversation records
- Environment-based configuration

## Technology stack

- React + Vite + JavaScript
- React Router
- Node.js + Express
- MongoDB + Mongoose
- Optional Ollama + Qwen 3 integration
- dotenv, Helmet, CORS, express-validator

## Project structure

- client/: React frontend
- server/: Express backend and business logic
- docs/: system and project documentation
- .gitignore: ignores env files and generated output

## Prerequisites

- Node.js 24
- MongoDB running locally or a MongoDB Atlas connection string
- Chrome or Edge with microphone access for browser voice APIs
- Ollama and Qwen are optional for the default deterministic path

## MongoDB setup

1. Install MongoDB locally or use a hosted MongoDB service.
2. Ensure the server can connect to the database.
3. Set the connection string in server/.env.

## Optional Ollama setup

1. Install Ollama.
2. Start the Ollama service.
3. Pull a compatible model such as Qwen 3.
4. Confirm the model is reachable using the base URL.

Example:

```bash
ollama pull qwen3
```

Then ensure the base URL points to the running Ollama service, such as http://localhost:11434.

## Environment variables

The backend and frontend each use their own .env files.

Server variables:

- PORT
- MONGODB_URI
- OLLAMA_BASE_URL
- OLLAMA_MODEL
- CLIENT_URL

Client variables:

- VITE_API_BASE_URL

See the example files in the client and server folders.

## Installation

```bash
npm install
```

## Running the frontend

```bash
npm run client
```

## Running the backend

```bash
npm run server
```

## Running both together

```bash
npm run dev
```

## API overview

The backend exposes REST endpoints for conversation creation, message processing, and customer/vehicle updates.

## Active architecture

The default voice path is:

Browser SpeechRecognition -> React -> Express API -> safety rules
-> knowledge retrieval -> assessment state machine -> MongoDB
-> React -> browser speechSynthesis

Ollama/Qwen is an optional provider behind 'server/src/services/aiService.js' it is disabled by default because voice interaction needs predictable latency and the deterministic path is easier to test.

## Safety approach

The app does not rely on the LLM alone to decide safety. A deterministic safety layer checks for urgent conditions such as smoke, fire, severe overheating, brake or steering failure, electrical hazards, and fuel leaks before suggesting next steps.




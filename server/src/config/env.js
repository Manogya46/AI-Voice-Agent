import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

export const env = {
  port: Number(process.env.PORT || 5000),
  mongodbUri:
    process.env.MONGODB_URI || 'mongodb://localhost:27017/car-service-agent',
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
  ollamaModel: process.env.OLLAMA_MODEL || 'qwen3',
  ollamaEnabled: process.env.OLLAMA_ENABLED === 'true',
  ollamaTimeoutMs: Number(process.env.OLLAMA_TIMEOUT_MS || 8000),
  ollamaFallbackCooldownMs: Number(
    process.env.OLLAMA_FALLBACK_COOLDOWN_MS || 60000
  ),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  nodeEnv: process.env.NODE_ENV || 'development',
};

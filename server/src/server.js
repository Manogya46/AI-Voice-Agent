import app from './app.js';
import { connectDatabase } from './config/database.js';
import { env } from './config/env.js';

connectDatabase();

app.listen(env.port, () => {
  console.log(`Server running on http://localhost:${env.port}`);
});

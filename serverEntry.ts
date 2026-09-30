import { startServer } from './server.ts';

startServer().catch(err => {
  console.error('❌ CGSSB server startup failed:', err);
  process.exit(1);
});

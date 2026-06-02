import { config } from 'dotenv';
config({ path: '.env.local' });
import { runQAAnalysis } from './src/lib/ai/qaAgent';

async function main() {
  const res = await runQAAnalysis("companyId", "sessionId");
  console.log("Result:", res);
}
main();

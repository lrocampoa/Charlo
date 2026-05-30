// Mock fetch to simulate network delay
const originalFetch = global.fetch;
global.fetch = async (url, options) => {
  if (url.includes('graph.facebook.com')) {
    // Simulate 100ms latency for sending a message
    return new Promise((resolve) => setTimeout(() => {
      resolve({ ok: true, text: async () => '' });
    }, 100));
  }
  return originalFetch(url, options);
};

const route = require('./.next/server/app/api/companies/[id]/campaigns/route.js'); // Assuming Next.js is built, or we'll need to use ts-node

async function run() {
  console.log("Not implemented yet");
}
run();

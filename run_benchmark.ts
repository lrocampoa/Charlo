import { performance } from 'perf_hooks';

const CONCURRENCY = 10;
const CUSTOMERS_COUNT = 50;

async function baseline(customers: any[], businessPhoneId: string, accessToken: string, templateName: string, languageCode: string) {
  let sentCount = 0;
  let failedCount = 0;

  for (const customer of customers) {
    try {
      const res = await fetch(`https://graph.facebook.com/v19.0/${businessPhoneId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: customer.customerId,
          type: "template",
          template: {
            name: templateName,
            language: { code: languageCode }
          }
        })
      });

      if (res.ok) {
        sentCount++;
      } else {
        failedCount++;
      }
    } catch (e) {
      failedCount++;
    }
  }

  return { sentCount, failedCount };
}

async function optimized(customers: any[], businessPhoneId: string, accessToken: string, templateName: string, languageCode: string) {
  let sentCount = 0;
  let failedCount = 0;

  // Chunking implementation
  const chunkSize = 50; // concurrency limit

  for (let i = 0; i < customers.length; i += chunkSize) {
    const chunk = customers.slice(i, i + chunkSize);
    await Promise.all(
      chunk.map(async (customer) => {
        try {
          const res = await fetch(`https://graph.facebook.com/v19.0/${businessPhoneId}/messages`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              messaging_product: "whatsapp",
              to: customer.customerId,
              type: "template",
              template: {
                name: templateName,
                language: { code: languageCode }
              }
            })
          });

          if (res.ok) {
            sentCount++;
          } else {
            failedCount++;
          }
        } catch (e) {
          failedCount++;
        }
      })
    );
  }

  return { sentCount, failedCount };
}


// Mock fetch
const originalFetch = global.fetch;
global.fetch = async (url: any, options: any) => {
  if (typeof url === 'string' && url.includes('graph.facebook.com')) {
    return new Promise((resolve) => setTimeout(() => {
      resolve({ ok: true, text: async () => '' } as any);
    }, 50)); // 50ms latency
  }
  return originalFetch(url, options);
};

async function main() {
  const customers = Array.from({ length: CUSTOMERS_COUNT }).map((_, i) => ({ customerId: `+123456789${i}` }));

  console.log(`Running baseline with ${CUSTOMERS_COUNT} customers...`);
  const t0 = performance.now();
  await baseline(customers, 'test-phone-id', 'test-token', 'test-template', 'en');
  const t1 = performance.now();
  console.log(`Baseline took ${(t1 - t0).toFixed(2)}ms`);

  console.log(`Running optimized with ${CUSTOMERS_COUNT} customers...`);
  const t2 = performance.now();
  await optimized(customers, 'test-phone-id', 'test-token', 'test-template', 'en');
  const t3 = performance.now();
  console.log(`Optimized took ${(t3 - t2).toFixed(2)}ms`);
}

main().catch(console.error);

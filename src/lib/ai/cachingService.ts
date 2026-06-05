import { GoogleAICacheManager } from '@google/generative-ai/server';
import { updateCompany } from '../firebase/dbUtils';

const cacheManager = new GoogleAICacheManager(process.env.GEMINI_API_KEY || '');

export async function createCompanyCache(companyId: string, advancedSOPs: string, persona: string = "Amable asistente virtual") {
  console.log(`[CacheService] Creating new Gemini Cache for company ${companyId}...`);
  
  // Create a cache with the Gemini Flash model
  const cacheResult = await cacheManager.create({
    model: 'models/gemini-flash-latest',
    displayName: `SOPs for ${companyId}`,
    systemInstruction: `Eres un asistente virtual de IA para esta empresa.\n\nPersona Configured: ${persona}\n\nPERMANENT INSTRUCTIONS & SOPs:\n${advancedSOPs}`,
    contents: [
      {
        role: 'user',
        parts: [{ text: 'Please read the provided SOPs carefully to assist our customers.' }],
      },
    ],
    ttlSeconds: 24 * 60 * 60, // 24 hours
  });

  console.log(`[CacheService] Cache created successfully: ${cacheResult.name}`);

  // Save the cache ID and expiry time to Firebase
  const expiryTime = new Date();
  expiryTime.setHours(expiryTime.getHours() + 24);

  await updateCompany(companyId, {
    geminiCacheId: cacheResult.name,
    geminiCacheExpiry: expiryTime.toISOString(),
  });

  return cacheResult.name;
}

export async function deleteCompanyCache(cacheName: string) {
  if (!cacheName) return;
  console.log(`[CacheService] Deleting old cache ${cacheName}...`);
  try {
    await cacheManager.delete(cacheName);
    console.log(`[CacheService] Cache ${cacheName} deleted.`);
  } catch (error) {
    console.error(`[CacheService] Failed to delete cache ${cacheName}:`, error);
  }
}

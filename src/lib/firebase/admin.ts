import * as admin from 'firebase-admin';

let isInitialized = false;

if (!admin.apps.length) {
  if (!process.env.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY === "your_private_key_here") {
    console.warn("⚠️ FIREBASE_PRIVATE_KEY is missing or invalid. Firebase Admin will not initialize.");
  } else {
    try {
      // Fix potential formatting issues in the strings from Render/Vercel
      let pk = process.env.FIREBASE_PRIVATE_KEY || '';
      // A valid PEM key never contains quotes. Remove them completely.
      pk = pk.replace(/["']/g, '');
      // Handle literal newlines or escaped newlines
      pk = pk.replace(/\\n/g, '\n').replace(/\\r/g, '').trim();
      
      const pId = (process.env.FIREBASE_PROJECT_ID || '').replace(/["']/g, '').trim();
      const cEmail = (process.env.FIREBASE_CLIENT_EMAIL || '').replace(/["']/g, '').trim();

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: pId,
          clientEmail: cEmail,
          privateKey: pk,
        }),
      });
      isInitialized = true;
    } catch (error) {
      console.error('❌ Firebase admin initialization error. Check your credentials format.', error);
    }
  }
} else {
  isInitialized = true;
}

// Export null if initialization failed so it doesn't crash the build phase.
// getDb() in dbUtils will throw at RUNTIME if these are null.
const adminDb = isInitialized ? admin.firestore() : null;
const adminAuth = isInitialized ? admin.auth() : null;
const adminStorage = isInitialized ? admin.storage() : null;

export async function verifyIdToken(req: Request): Promise<string | null> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ') || !adminAuth) return null;
  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    return decodedToken.uid;
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
}

export async function verifyOwnership(req: Request, companyId: string): Promise<boolean> {
  const userId = await verifyIdToken(req);
  if (!userId || !adminDb) return false;
  try {
    const doc = await adminDb.collection('companies').doc(companyId).get();
    if (!doc.exists) return false;
    return doc.data()?.ownerId === userId;
  } catch (e) {
    return false;
  }
}

export async function verifyActiveSubscription(companyId: string): Promise<boolean> {
  if (!adminDb) return false;
  try {
    const doc = await adminDb.collection('companies').doc(companyId).get();
    if (!doc.exists) return false;
    const company = doc.data();
    
    // Fallback to company subscription if user is missing for some reason
    let tier = company?.subscription?.tier;
    let status = company?.subscription?.status;

    const ownerId = company?.ownerId;
    if (ownerId) {
      const userDoc = await adminDb.collection('users').doc(ownerId).get();
      if (userDoc.exists) {
        const user = userDoc.data();
        tier = user?.subscription?.tier || tier;
        status = user?.subscription?.status || status;
      }
    }
    
    // Free Sandbox tier is allowed
    if (tier === 'free' && status === 'active') return true;
    
    // Paid tiers must be active or trialing
    if (status === 'active' || status === 'trialing') return true;
    
    return false;
  } catch (e) {
    return false;
  }
}

export { adminDb, adminAuth };

import * as admin from 'firebase-admin';

let isInitialized = false;

if (!admin.apps.length) {
  if (!process.env.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY === "your_private_key_here") {
    console.warn("⚠️ FIREBASE_PRIVATE_KEY is missing or invalid. Firebase Admin will not initialize.");
  } else {
    try {
      // Fix potential formatting issues in the strings from Render/Vercel
      let pk = process.env.FIREBASE_PRIVATE_KEY;
      pk = pk.replace(/\\n/g, '\n').replace(/^"|"$/g, '').replace(/^'|'$/g, '').trim();
      
      const pId = process.env.FIREBASE_PROJECT_ID?.replace(/^"|"$/g, '').replace(/^'|'$/g, '').trim();
      const cEmail = process.env.FIREBASE_CLIENT_EMAIL?.replace(/^"|"$/g, '').replace(/^'|'$/g, '').trim();

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

export { adminDb, adminAuth };

import * as admin from 'firebase-admin';

let isInitialized = false;

if (!admin.apps.length) {
  try {
    if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_PRIVATE_KEY !== "your_private_key_here") {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          // Handle newline characters in the private key from env variables
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
      isInitialized = true;
    } else {
      console.warn("⚠️ FIREBASE_PRIVATE_KEY is invalid or missing. Firebase Admin SDK is running in MOCK mode.");
    }
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
} else {
  isInitialized = true;
}

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

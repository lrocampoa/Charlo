import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  if (!process.env.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY === "your_private_key_here") {
    throw new Error("FIREBASE_PRIVATE_KEY is missing or invalid. Check your environment variables. The server cannot start securely without a valid Firebase configuration.");
  }
  
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Handle newline characters in the private key from env variables
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
    throw error;
  }
}

const adminDb = admin.firestore();
const adminAuth = admin.auth();

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

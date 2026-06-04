const { config } = require('dotenv');
config({ path: '.env.local' });
const admin = require('firebase-admin');

let pk = process.env.FIREBASE_PRIVATE_KEY || '';
pk = pk.replace(/["']/g, '');
pk = pk.replace(/\\n/g, '\n').replace(/\\r/g, '').trim();
const pId = (process.env.FIREBASE_PROJECT_ID || '').replace(/["']/g, '').trim();
const cEmail = (process.env.FIREBASE_CLIENT_EMAIL || '').replace(/["']/g, '').trim();

if (!pk || !pId || !cEmail) {
    console.error("Missing Firebase Admin credentials in .env.local");
    process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: pId,
    clientEmail: cEmail,
    privateKey: pk,
  }),
});

const adminAuth = admin.auth();
const adminDb = admin.firestore();

async function deleteAllUsers() {
    let listUsersResult;
    try {
        listUsersResult = await adminAuth.listUsers(1000);
        const users = listUsersResult.users;
        console.log(`Found ${users.length} users.`);
        
        for (const user of users) {
            await adminAuth.deleteUser(user.uid);
            console.log(`Deleted user ${user.email} (${user.uid})`);
            
            // Delete associated companies to avoid orphaned data
            const companies = await adminDb.collection('companies').where('ownerId', '==', user.uid).get();
            for (const doc of companies.docs) {
                await doc.ref.delete();
                console.log(`Deleted company ${doc.id} owned by ${user.uid}`);
            }
        }
        console.log("Done.");
    } catch (error) {
        console.error("Error deleting users:", error);
    }
}

deleteAllUsers();

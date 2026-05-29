import { NextResponse } from 'next/server';
import { adminDb, verifyIdToken } from '@/lib/firebase/admin';
import { getCompanySessions } from '@/lib/firebase/dbUtils';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await verifyIdToken(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: companyId } = await params;

    // Auth check
    if (!adminDb) return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    
    const companyRef = adminDb.collection('companies').doc(companyId);
    const companyDoc = await companyRef.get();
    if (!companyDoc.exists || companyDoc.data()?.ownerId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const sessions = await getCompanySessions(companyId);

    const totalConversations = sessions.length;
    let aiHandled = 0;
    let humanHandled = 0;
    let totalMessages = 0;

    sessions.forEach((s: any) => {
      if (s.status === 'ai_handling') {
        aiHandled++;
      } else {
        humanHandled++;
      }
      
      if (Array.isArray(s.history)) {
        totalMessages += s.history.length;
      }
    });

    const aiResolutionRate = totalConversations > 0 ? Math.round((aiHandled / totalConversations) * 100) : 0;
    
    // Calculate Hours Saved
    // Assumes each conversation resolved by AI saves 5 minutes of human typing time
    const minutesSaved = aiHandled * 5;
    const hoursSaved = parseFloat((minutesSaved / 60).toFixed(1));

    return NextResponse.json({
      metrics: {
        totalConversations,
        aiResolutionRate,
        aiHandled,
        humanHandled,
        totalMessages,
        hoursSaved
      }
    });

  } catch (error) {
    console.error("Analytics GET Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { db } from '@/utils/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    // Verify it's a valid GitHub webhook (simplified for MVP)
    // In production, we should verify the x-hub-signature-256 header

    let eventType = request.headers.get('x-github-event') || 'unknown';

    // We only care about pushes or pull requests for generating content
    if (eventType !== 'push' && eventType !== 'pull_request') {
      return NextResponse.json({ message: 'Event ignored' }, { status: 200 });
    }

    console.log('1. Webhook received', eventType);

    const docData = {
      source: 'github',
      eventType,
      payload,
      createdAt: serverTimestamp(),
      status: 'raw', // 'raw', 'processing', 'drafted'
    };

    console.log('2. Adding to firestore');
    const docRef = await addDoc(collection(db, 'Events'), docData);
    console.log('3. Added with ID', docRef.id);

    // Normally, here we would trigger the AI Agent to draft a post.
    // For now, we just save the raw event to Firestore.

    return NextResponse.json({ success: true, id: docRef.id }, { status: 200 });

  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

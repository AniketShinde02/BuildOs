import { NextResponse } from 'next/server';
import { db } from '@/utils/firebase';
import { doc, getDoc, collection, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
  try {
    const { eventId } = await request.json();
    if (!eventId) {
      return NextResponse.json({ error: 'Missing eventId' }, { status: 400 });
    }

    // 1. Fetch raw event from Firestore
    const eventRef = doc(db, 'Events', eventId);
    const eventSnap = await getDoc(eventRef);

    if (!eventSnap.exists()) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const eventData = eventSnap.data();

    // 2. Extract context from GitHub event
    // Simplification for MVP: We just stringify the payload.
    // In production, we'd extract commits, messages, files changed, etc.
    const commitMessage = eventData.payload?.commits?.[0]?.message || 'Code changes';
    const repoName = eventData.payload?.repository?.name || 'project';
    const author = eventData.payload?.sender?.login || 'I';

    // 3. Prompt Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
    const prompt = `
      You are a developer building a product in public.
      Convert this recent GitHub work into a professional, engaging LinkedIn post.
      Keep it authentic, focus on what was learned or built, and do not use generic AI buzzwords.
      
      Repository: ${repoName}
      Author: ${author}
      Commit Message: ${commitMessage}
      
      Output ONLY the LinkedIn post text.
    `;

    const result = await model.generateContent(prompt);
    const draftText = result.response.text();

    // 4. Save to Drafts collection
    const draftData = {
      eventId,
      content: draftText,
      platform: 'linkedin',
      status: 'pending', // 'pending', 'approved', 'published'
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const draftRef = await addDoc(collection(db, 'Drafts'), draftData);

    // 5. Update event status
    await updateDoc(eventRef, { status: 'drafted' });

    return NextResponse.json({ success: true, draftId: draftRef.id, content: draftText }, { status: 200 });

  } catch (error: any) {
    console.error('Generation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

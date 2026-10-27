import { NextResponse } from 'next/server';
import { db } from '@/utils/firebase';
import { collection, query, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { generateContentWithFallback } from '@/lib/ai/gateway';

export async function POST(_req: Request) {
  try {
    // 1. Fetch GitHub events from the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const eventsRef = collection(db, 'Events');
    // For a real app, query by createdAt >= sevenDaysAgo. 
    // Here we just fetch all events for the simulation since it's a new db.
    const q = query(eventsRef);
    const querySnapshot = await getDocs(q);
    
    const events = querySnapshot.docs.map(doc => doc.data());
    
    if (events.length === 0) {
      return NextResponse.json({ message: 'No events found to summarize' }, { status: 404 });
    }

    // 2. Format events for the prompt
    const eventSummary = events.map(e => `- ${e.eventType} on ${e.payload?.repository?.name || 'repo'}`).join('\n');
    
    // 3. Generate content with AI Gateway
    const systemPrompt = "You are a developer sharing a weekly recap on LinkedIn/Twitter.";
    const userPrompt = `Here are your GitHub events from the past week:\n${eventSummary}\n\nWrite a professional, concise, and engaging social media post (under 500 characters) summarizing this activity. Do not include hashtags.`;
    
    const generatedText = await generateContentWithFallback({
      systemInstruction: systemPrompt,
      prompt: userPrompt,
      requiredCapability: 'FAST_COPY'
    });
    
    if (!generatedText) {
      throw new Error("All AI engines failed to generate the recap.");
    }
    
    // 4. Save to Drafts
    await addDoc(collection(db, 'Drafts'), {
      content: generatedText,
      platform: 'LinkedIn',
      status: 'pending',
      createdAt: serverTimestamp()
    });

    return NextResponse.json({ success: true, message: 'Weekly recap generated' });
  } catch (error: any) {
    console.error('Error generating recap:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

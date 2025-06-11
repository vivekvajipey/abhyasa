import { NextRequest } from 'next/server';
import { parseStudyPlanWithStream, StudyPlanEvent } from '@/lib/gemini-study-plan-stream';
import { createClient } from '@/lib/supabase/server';
import { ensureUserExists } from '@/lib/ensure-user';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  // Ensure user exists in our database
  await ensureUserExists(supabase, user.id, user.email!);
  
  const { studyPlan, enableDevLogging } = await request.json();
  
  if (!studyPlan || typeof studyPlan !== 'string') {
    return new Response(JSON.stringify({ error: 'Study plan text is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  // Create a TransformStream for Server-Sent Events
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  
  // Function to send SSE events
  const sendEvent = async (event: StudyPlanEvent) => {
    const data = `data: ${JSON.stringify(event)}\n\n`;
    await writer.write(encoder.encode(data));
  };
  
  // Start the import process in the background
  parseStudyPlanWithStream(studyPlan, user.id, sendEvent, enableDevLogging || false)
    .then(async (result) => {
      // Send final success event
      await sendEvent({
        type: 'complete',
        message: 'Import completed successfully!',
        data: {
          ...result.summary,
          devLogSessionId: result.devLogSessionId,
        },
      });
      await writer.close();
    })
    .catch(async (error) => {
      // Send error event
      await sendEvent({
        type: 'error',
        message: error instanceof Error ? error.message : 'Import failed',
      });
      await writer.close();
    });
    
  // Add a timeout to prevent hanging connections
  setTimeout(async () => {
    try {
      await writer.close();
    } catch {}
  }, 300000); // 5 minute timeout
  
  // Return the SSE response
  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
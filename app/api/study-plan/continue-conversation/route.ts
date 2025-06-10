import { NextRequest } from 'next/server';
import { continueStudyPlanConversation } from '@/lib/gemini-study-plan-stream';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  const { userResponse, conversationId, context, enableDevLogging } = await request.json();
  
  if (!userResponse || !conversationId || !context) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  // Create a TransformStream for Server-Sent Events
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  
  // Function to send SSE events
  const sendEvent = async (event: any) => {
    const data = `data: ${JSON.stringify(event)}\n\n`;
    await writer.write(encoder.encode(data));
  };
  
  // Reconstruct the context with the event handler
  context.onEvent = sendEvent;
  
  // Continue the conversation
  continueStudyPlanConversation(userResponse, conversationId, context, enableDevLogging)
    .then(async (result) => {
      if (result.needsResponse) {
        // AI is asking another question
        await sendEvent({
          type: 'question',
          message: result.question,
          conversationId: result.conversationId,
          data: { context: result.context },
        });
      } else if (result.success) {
        // Import completed
        await sendEvent({
          type: 'complete',
          message: 'Import completed successfully!',
          data: {
            ...result.summary,
            devLogPath: result.devLogPath,
            devLogSessionId: result.devLogSessionId,
          },
        });
      }
      await writer.close();
    })
    .catch(async (error) => {
      // Send error event
      await sendEvent({
        type: 'error',
        message: error instanceof Error ? error.message : 'Continuation failed',
      });
      await writer.close();
    });
  
  // Add a timeout
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
import { NextRequest } from 'next/server';
import { editGoalWithAI, StudyPlanEvent } from '@/lib/gemini-study-plan-stream';
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
  
  const { goalId, editRequest, enableDevLogging } = await request.json();
  
  if (!goalId || !editRequest || typeof editRequest !== 'string') {
    return new Response(JSON.stringify({ error: 'Goal ID and edit request are required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  // Verify user owns the goal
  const { data: goal, error: goalError } = await supabase
    .from('goals')
    .select('id')
    .eq('id', goalId)
    .eq('user_id', user.id)
    .single();
  
  if (goalError || !goal) {
    return new Response(JSON.stringify({ error: 'Goal not found or unauthorized' }), {
      status: 404,
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
  
  // Start the edit process in the background
  editGoalWithAI(goalId, editRequest, user.id, sendEvent, enableDevLogging || false)
    .then(async (result) => {
      // Send final success event
      await sendEvent({
        type: 'complete',
        message: 'Edit completed successfully!',
        data: {
          ...result.summary,
          devLogPath: result.devLogPath,
          devLogSessionId: result.devLogSessionId,
        },
      });
      await writer.close();
    })
    .catch(async (error) => {
      // Send error event
      await sendEvent({
        type: 'error',
        message: error instanceof Error ? error.message : 'Edit failed',
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
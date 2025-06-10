import { NextRequest, NextResponse } from 'next/server';
import { parseStudyPlan } from '@/lib/gemini-study-plan';
import { createClient } from '@/lib/supabase/server';
import { ensureUserExists } from '@/lib/ensure-user';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Ensure user exists in our database
    await ensureUserExists(supabase, user.id, user.email!);
    
    const { studyPlan } = await request.json();
    
    if (!studyPlan || typeof studyPlan !== 'string') {
      return NextResponse.json(
        { error: 'Study plan text is required' },
        { status: 400 }
      );
    }
    
    // Parse the study plan using Gemini
    const result = await parseStudyPlan(studyPlan, user.id);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error importing study plan:', error);
    return NextResponse.json(
      { 
        error: 'Failed to import study plan', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
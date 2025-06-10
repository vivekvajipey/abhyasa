import { GoogleGenerativeAI, SchemaType, FunctionDeclaration } from '@google/generative-ai';
import { createClient } from '@/lib/supabase/server';
import { GeminiDevLogger } from './gemini-dev-logger';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Define the function schemas for Gemini to use
const functionDeclarations: FunctionDeclaration[] = [
  {
    name: 'createGoal',
    description: 'Create a new learning goal',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        title: {
          type: SchemaType.STRING,
          description: 'Title of the learning goal',
        },
        description: {
          type: SchemaType.STRING,
          description: 'Detailed description of the goal',
        },
        target_date: {
          type: SchemaType.STRING,
          description: 'Target completion date in ISO format',
        },
        start_date: {
          type: SchemaType.STRING,
          description: 'Start date in ISO format',
        },
        daily_commitment_hours: {
          type: SchemaType.NUMBER,
          description: 'Daily commitment in hours',
        },
      },
      required: ['title', 'description', 'target_date'],
    },
  },
  {
    name: 'createPhase',
    description: 'Create a phase within a goal',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        goal_id: {
          type: SchemaType.STRING,
          description: 'ID of the parent goal',
        },
        name: {
          type: SchemaType.STRING,
          description: 'Name of the phase',
        },
        description: {
          type: SchemaType.STRING,
          description: 'Description of what this phase focuses on',
        },
        start_date: {
          type: SchemaType.STRING,
          description: 'Start date of the phase in ISO format',
        },
        end_date: {
          type: SchemaType.STRING,
          description: 'End date of the phase in ISO format',
        },
        order_index: {
          type: SchemaType.NUMBER,
          description: 'Order of this phase (1-based)',
        },
      },
      required: ['goal_id', 'name', 'description', 'order_index'],
    },
  },
  {
    name: 'createResource',
    description: 'Create a learning resource',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        title: {
          type: SchemaType.STRING,
          description: 'Title of the resource',
        },
        type: {
          type: SchemaType.STRING,
          description: 'Type of resource',
          format: 'enum',
          enum: ['textbook', 'reading', 'practice_exam', 'problem_set', 'video', 'reference', 'website'],
        },
        description: {
          type: SchemaType.STRING,
          description: 'Description of the resource',
        },
        url: {
          type: SchemaType.STRING,
          description: 'URL link to the resource',
        },
        author: {
          type: SchemaType.STRING,
          description: 'Author or creator of the resource',
        },
        justification: {
          type: SchemaType.STRING,
          description: 'Why this resource is valuable',
        },
      },
      required: ['title', 'type', 'description'],
    },
  },
  {
    name: 'createActivity',
    description: 'Create an activity within a phase',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        phase_id: {
          type: SchemaType.STRING,
          description: 'ID of the parent phase',
        },
        resource_id: {
          type: SchemaType.STRING,
          description: 'ID of the resource this activity uses',
        },
        name: {
          type: SchemaType.STRING,
          description: 'Name of the activity',
        },
        description: {
          type: SchemaType.STRING,
          description: 'Description of what to do in this activity',
        },
        order_index: {
          type: SchemaType.NUMBER,
          description: 'Order within the phase (1-based)',
        },
        estimated_hours: {
          type: SchemaType.NUMBER,
          description: 'Estimated hours to complete',
        },
        activity_type: {
          type: SchemaType.STRING,
          description: 'Type of activity',
          format: 'enum',
          enum: ['reading', 'practice', 'review', 'assessment'],
        },
      },
      required: ['phase_id', 'name', 'description', 'order_index'],
    },
  },
  {
    name: 'updateGoal',
    description: 'Update an existing goal',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        goal_id: {
          type: SchemaType.STRING,
          description: 'ID of the goal to update',
        },
        title: {
          type: SchemaType.STRING,
          description: 'New title (optional)',
        },
        description: {
          type: SchemaType.STRING,
          description: 'New description (optional)',
        },
        target_date: {
          type: SchemaType.STRING,
          description: 'New target date in ISO format (optional)',
        },
        daily_commitment_hours: {
          type: SchemaType.NUMBER,
          description: 'New daily commitment in hours (optional)',
        },
      },
      required: ['goal_id'],
    },
  },
  {
    name: 'updatePhase',
    description: 'Update an existing phase',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        phase_id: {
          type: SchemaType.STRING,
          description: 'ID of the phase to update',
        },
        name: {
          type: SchemaType.STRING,
          description: 'New name (optional)',
        },
        description: {
          type: SchemaType.STRING,
          description: 'New description (optional)',
        },
        start_date: {
          type: SchemaType.STRING,
          description: 'New start date in ISO format (optional)',
        },
        end_date: {
          type: SchemaType.STRING,
          description: 'New end date in ISO format (optional)',
        },
      },
      required: ['phase_id'],
    },
  },
  {
    name: 'updateActivity',
    description: 'Update an existing activity',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        activity_id: {
          type: SchemaType.STRING,
          description: 'ID of the activity to update',
        },
        title: {
          type: SchemaType.STRING,
          description: 'New title (optional)',
        },
        description: {
          type: SchemaType.STRING,
          description: 'New description (optional)',
        },
        estimated_hours: {
          type: SchemaType.NUMBER,
          description: 'New estimated hours (optional)',
        },
        resource_id: {
          type: SchemaType.STRING,
          description: 'New resource ID (optional)',
        },
      },
      required: ['activity_id'],
    },
  },
  {
    name: 'deletePhase',
    description: 'Delete a phase and all its activities',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        phase_id: {
          type: SchemaType.STRING,
          description: 'ID of the phase to delete',
        },
      },
      required: ['phase_id'],
    },
  },
  {
    name: 'deleteActivity',
    description: 'Delete an activity',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        activity_id: {
          type: SchemaType.STRING,
          description: 'ID of the activity to delete',
        },
      },
      required: ['activity_id'],
    },
  },
  {
    name: 'getGoalContext',
    description: 'Get current state of a goal with all phases, activities, and resources',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        goal_id: {
          type: SchemaType.STRING,
          description: 'ID of the goal to retrieve',
        },
      },
      required: ['goal_id'],
    },
  },
  {
    name: 'getCreatedEntities',
    description: 'Get summary of all created entities',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {},
    },
  },
];

export interface StudyPlanEvent {
  type: 'start' | 'thinking' | 'creating' | 'created' | 'updating' | 'updated' | 'deleting' | 'deleted' | 'error' | 'complete' | 'question';
  entity?: 'goal' | 'phase' | 'resource' | 'activity';
  data?: any;
  message?: string;
  progress?: {
    current: number;
    total: number;
  };
  conversationId?: string;
}

interface StudyPlanContext {
  userId: string;
  mode?: 'create' | 'edit';
  existingGoal?: any;
  createdGoal: any;
  createdPhases: any[];
  createdResources: any[];
  createdActivities: any[];
  updatedEntities: any[];
  deletedEntities: any[];
  onEvent?: (event: StudyPlanEvent) => void;
  logger?: GeminiDevLogger;
  chat?: any;
  conversationId?: string;
}

// Function to execute the actual database operations
async function executeFunctionCall(functionCall: any, context: StudyPlanContext) {
  const { name, args } = functionCall;
  const supabase = await createClient();
  const startTime = Date.now();
  
  // Log tool call
  await context.logger?.logToolCall(name, args, null, 0);
  
  // Emit appropriate event based on operation type
  const isUpdate = name.startsWith('update');
  const isDelete = name.startsWith('delete');
  const isGet = name.startsWith('get');
  
  if (!isGet) {
    context.onEvent?.({
      type: isUpdate ? 'updating' : isDelete ? 'deleting' : 'creating',
      entity: name.replace(/^(create|update|delete)/, '').toLowerCase() as any,
      data: args,
      message: `${isUpdate ? 'Updating' : isDelete ? 'Deleting' : 'Creating'} ${name.replace(/^(create|update|delete)/, '').toLowerCase()}: ${args.title || args.name || args.goal_id || args.phase_id || args.activity_id}`,
    });
  }
  
  try {
    switch (name) {
      case 'createGoal': {
        const { data, error } = await supabase
          .from('goals')
          .insert({
            user_id: context.userId,
            title: args.title,
            description: args.description,
            target_date: args.target_date,
            start_date: args.start_date,
            daily_commitment_hours: args.daily_commitment_hours,
          })
          .select()
          .single();
        
        if (error) throw error;
        context.createdGoal = data;
        
        context.onEvent?.({
          type: 'created',
          entity: 'goal',
          data: data,
          message: `Created goal: ${data.title}`,
        });
        
        const result = { success: true, goalId: data.id };
        await context.logger?.logToolCall(name, args, result, Date.now() - startTime);
        return result;
      }
      
      case 'createPhase': {
        const { data, error } = await supabase
          .from('phases')
          .insert({
            goal_id: args.goal_id,
            name: args.name,
            description: args.description,
            start_date: args.start_date,
            end_date: args.end_date,
            order_index: args.order_index,
          })
          .select()
          .single();
        
        if (error) throw error;
        context.createdPhases.push(data);
        
        context.onEvent?.({
          type: 'created',
          entity: 'phase',
          data: data,
          message: `Created phase ${args.order_index}: ${data.name}`,
          progress: {
            current: context.createdPhases.length,
            total: 4, // Estimate based on typical study plans
          },
        });
        
        const result = { success: true, phaseId: data.id };
        await context.logger?.logToolCall(name, args, result, Date.now() - startTime);
        return result;
      }
      
      case 'createResource': {
        const { data, error } = await supabase
          .from('resources')
          .insert({
            user_id: context.userId,
            title: args.title,
            type: args.type,
            description: args.description,
            url: args.url,
            metadata: {
              author: args.author,
              justification: args.justification,
            },
          })
          .select()
          .single();
        
        if (error) throw error;
        context.createdResources.push(data);
        
        context.onEvent?.({
          type: 'created',
          entity: 'resource',
          data: data,
          message: `Created ${args.type}: ${data.title}`,
          progress: {
            current: context.createdResources.length,
            total: 10, // Estimate
          },
        });
        
        const result = { success: true, resourceId: data.id };
        await context.logger?.logToolCall(name, args, result, Date.now() - startTime);
        return result;
      }
      
      case 'createActivity': {
        const { data, error } = await supabase
          .from('activities')
          .insert({
            phase_id: args.phase_id,
            resource_id: args.resource_id,
            title: args.name,  // Changed from 'name' to 'title' to match schema
            description: args.description,
            order_index: args.order_index,
            estimated_hours: args.estimated_hours,
            type: args.activity_type,  // Changed from 'activity_type' to 'type' to match schema
          })
          .select()
          .single();
        
        if (error) throw error;
        context.createdActivities.push(data);
        
        context.onEvent?.({
          type: 'created',
          entity: 'activity',
          data: data,
          message: `Created activity: ${data.title}`,
          progress: {
            current: context.createdActivities.length,
            total: 20, // Estimate
          },
        });
        
        const result = { success: true, activityId: data.id };
        await context.logger?.logToolCall(name, args, result, Date.now() - startTime);
        return result;
      }
      
      case 'updateGoal': {
        const updateData: any = {};
        if (args.title) updateData.title = args.title;
        if (args.description) updateData.description = args.description;
        if (args.target_date) updateData.target_date = args.target_date;
        if (args.daily_commitment_hours) updateData.daily_commitment_hours = args.daily_commitment_hours;
        
        const { data, error } = await supabase
          .from('goals')
          .update(updateData)
          .eq('id', args.goal_id)
          .eq('user_id', context.userId)
          .select()
          .single();
        
        if (error) throw error;
        context.updatedEntities.push({ type: 'goal', data });
        
        context.onEvent?.({
          type: 'updated',
          entity: 'goal',
          data: data,
          message: `Updated goal: ${data.title}`,
        });
        
        const result = { success: true, goalId: data.id };
        await context.logger?.logToolCall(name, args, result, Date.now() - startTime);
        return result;
      }
      
      case 'updatePhase': {
        const updateData: any = {};
        if (args.name) updateData.name = args.name;
        if (args.description) updateData.description = args.description;
        if (args.start_date) updateData.start_date = args.start_date;
        if (args.end_date) updateData.end_date = args.end_date;
        
        const { data, error } = await supabase
          .from('phases')
          .update(updateData)
          .eq('id', args.phase_id)
          .select()
          .single();
        
        if (error) throw error;
        context.updatedEntities.push({ type: 'phase', data });
        
        context.onEvent?.({
          type: 'updated',
          entity: 'phase',
          data: data,
          message: `Updated phase: ${data.name}`,
        });
        
        const result = { success: true, phaseId: data.id };
        await context.logger?.logToolCall(name, args, result, Date.now() - startTime);
        return result;
      }
      
      case 'updateActivity': {
        const updateData: any = {};
        if (args.title) updateData.title = args.title;
        if (args.description) updateData.description = args.description;
        if (args.estimated_hours) updateData.estimated_hours = args.estimated_hours;
        if (args.resource_id) updateData.resource_id = args.resource_id;
        
        const { data, error } = await supabase
          .from('activities')
          .update(updateData)
          .eq('id', args.activity_id)
          .select()
          .single();
        
        if (error) throw error;
        context.updatedEntities.push({ type: 'activity', data });
        
        context.onEvent?.({
          type: 'updated',
          entity: 'activity',
          data: data,
          message: `Updated activity: ${data.title}`,
        });
        
        const result = { success: true, activityId: data.id };
        await context.logger?.logToolCall(name, args, result, Date.now() - startTime);
        return result;
      }
      
      case 'deletePhase': {
        const { error } = await supabase
          .from('phases')
          .delete()
          .eq('id', args.phase_id);
        
        if (error) throw error;
        context.deletedEntities.push({ type: 'phase', id: args.phase_id });
        
        context.onEvent?.({
          type: 'deleted',
          entity: 'phase',
          data: { id: args.phase_id },
          message: `Deleted phase`,
        });
        
        const result = { success: true, phaseId: args.phase_id };
        await context.logger?.logToolCall(name, args, result, Date.now() - startTime);
        return result;
      }
      
      case 'deleteActivity': {
        const { error } = await supabase
          .from('activities')
          .delete()
          .eq('id', args.activity_id);
        
        if (error) throw error;
        context.deletedEntities.push({ type: 'activity', id: args.activity_id });
        
        context.onEvent?.({
          type: 'deleted',
          entity: 'activity',
          data: { id: args.activity_id },
          message: `Deleted activity`,
        });
        
        const result = { success: true, activityId: args.activity_id };
        await context.logger?.logToolCall(name, args, result, Date.now() - startTime);
        return result;
      }
      
      case 'getGoalContext': {
        // Fetch goal with all related data
        const { data: goal, error } = await supabase
          .from('goals')
          .select(`
            *,
            phases (
              *,
              activities (
                *,
                resources (*)
              )
            ),
            goal_resources (
              *,
              resources (*)
            )
          `)
          .eq('id', args.goal_id)
          .eq('user_id', context.userId)
          .single();
        
        if (error) throw error;
        
        const result = {
          success: true,
          goal: goal,
          phases: goal.phases || [],
          resources: goal.goal_resources?.map((gr: any) => gr.resources) || [],
          totalActivities: goal.phases?.reduce((sum: number, phase: any) => sum + (phase.activities?.length || 0), 0) || 0
        };
        
        await context.logger?.logToolCall(name, args, result, Date.now() - startTime);
        return result;
      }
      
      case 'getCreatedEntities': {
        const result = {
          goal: context.createdGoal || context.existingGoal,
          phases: context.createdPhases.length,
          resources: context.createdResources.length,
          activities: context.createdActivities.length,
          updates: context.updatedEntities.length,
          deletions: context.deletedEntities.length,
        };
        await context.logger?.logToolCall(name, args, result, Date.now() - startTime);
        return result;
      }
      
      default:
        throw new Error(`Unknown function: ${name}`);
    }
  } catch (error) {
    context.onEvent?.({
      type: 'error',
      entity: name.replace('create', '').toLowerCase() as any,
      message: `Failed to create ${name.replace('create', '').toLowerCase()}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      data: { args, error },
    });
    throw error;
  }
}

export async function parseStudyPlanWithStream(
  studyPlanText: string, 
  userId: string,
  onEvent: (event: StudyPlanEvent) => void,
  enableDevLogging: boolean = false,
  conversationId?: string,
  previousContext?: StudyPlanContext
) {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-pro-preview-06-05',
    tools: [{ functionDeclarations }],
  });
  
  // Initialize logger if enabled
  let logger: GeminiDevLogger | undefined;
  if (enableDevLogging) {
    logger = new GeminiDevLogger();
    await logger.init();
    await logger.logInfo('Starting study plan import', {
      userId,
      studyPlanLength: studyPlanText.length,
      model: 'gemini-2.5-pro-preview-06-05'
    });
  }
  
  const context: StudyPlanContext = previousContext || {
    userId,
    mode: 'create',
    existingGoal: null,
    createdGoal: null,
    createdPhases: [],
    createdResources: [],
    createdActivities: [],
    updatedEntities: [],
    deletedEntities: [],
    onEvent,
    logger,
    conversationId: conversationId || crypto.randomUUID(),
  };
  
  onEvent({
    type: 'start',
    message: 'Starting to analyze your study plan...',
  });
  
  const systemPrompt = `You are an expert educational planner. Your task is to convert a natural language study plan into structured data for the Abhyasa learning platform.

Given a study plan, you will:
1. First create the main learning goal with its title, description, and target date
2. Create phases in chronological order with appropriate date ranges
3. Create all unique resources mentioned in the plan
4. Create activities within each phase, linking them to appropriate resources

Important guidelines:
- Extract exact dates when provided, or calculate them based on the timeline
- Preserve all URLs and links exactly as provided
- Create resources before creating activities that reference them
- Use descriptive names and include justifications when provided
- Maintain the logical flow and structure of the original plan
- If a resource is mentioned multiple times, only create it once
- Activities should be specific and actionable

The study plan text is:
${studyPlanText}`;
  
  onEvent({
    type: 'thinking',
    message: 'Analyzing the study plan structure and extracting key information...',
  });
  
  try {
    // Reuse existing chat or create new one
    const chat = context.chat || model.startChat();
    context.chat = chat;
    
    let iterations = 0;
    const maxIterations = 50; // Safety limit
    
    // Log initial request
    const requestId = await logger?.logRequest('gemini-2.5-pro-preview-06-05', systemPrompt, {
      functionDeclarations: functionDeclarations.map(f => ({ name: f.name, description: f.description }))
    });
    
    // Send the initial prompt
    const requestStartTime = Date.now();
    let result = await chat.sendMessage(systemPrompt);
    
    // Log initial response
    await logger?.logResponse(
      requestId || '', 
      result.response.text() || '', 
      result.response.functionCalls(),
      Date.now() - requestStartTime
    );
    
    // Process function calls in a loop
    while (iterations < maxIterations) {
      iterations++;
      
      // Check if there are function calls to process
      const functionCalls = result.response.functionCalls();
      const responseText = result.response.text();
      
      // Check if AI is asking a question
      if (!functionCalls || functionCalls.length === 0) {
        if (responseText && responseText.length > 0) {
          // AI is asking for clarification
          onEvent({
            type: 'question',
            message: responseText,
            conversationId: context.conversationId,
            data: { context }
          });
          
          // Log the question
          await logger?.logInfo('AI asked for clarification', {
            question: responseText,
            conversationId: context.conversationId
          });
          
          // Return early - waiting for user response
          return {
            success: false,
            needsResponse: true,
            question: responseText,
            conversationId: context.conversationId,
            context,
          };
        }
        break;
      }
      
      onEvent({
        type: 'thinking',
        message: `Processing ${functionCalls.length} actions...`,
      });
      
      // Execute all function calls and collect results
      const functionResponses = [];
      for (const functionCall of functionCalls) {
        try {
          const functionResult = await executeFunctionCall(functionCall, context);
          functionResponses.push({
            functionResponse: {
              name: functionCall.name,
              response: functionResult,
            },
          });
        } catch (error) {
          functionResponses.push({
            functionResponse: {
              name: functionCall.name,
              response: { error: error instanceof Error ? error.message : 'Unknown error' },
            },
          });
        }
      }
      
      // Log continuation request
      const contRequestId = await logger?.logRequest(
        'gemini-2.5-pro-preview-06-05', 
        JSON.stringify(functionResponses),
        { iteration: iterations, type: 'function_responses' }
      );
      
      // Send function responses back to continue the conversation
      const contStartTime = Date.now();
      result = await chat.sendMessage(functionResponses);
      
      // Log continuation response
      await logger?.logResponse(
        contRequestId || '', 
        result.response.text() || '', 
        result.response.functionCalls(),
        Date.now() - contStartTime
      );
    }
    
    onEvent({
      type: 'complete',
      message: 'Study plan import completed successfully!',
      data: {
        goal: context.createdGoal,
        phasesCount: context.createdPhases.length,
        resourcesCount: context.createdResources.length,
        activitiesCount: context.createdActivities.length,
      },
    });
    
    const finalSummary = {
      goal: context.createdGoal,
      phasesCount: context.createdPhases.length,
      resourcesCount: context.createdResources.length,
      activitiesCount: context.createdActivities.length,
    };
    
    // Log final summary
    await logger?.logInfo('Study plan import completed', {
      ...finalSummary,
      totalIterations: iterations,
      loggerSummary: logger?.getSummary()
    });
    
    return {
      success: true,
      summary: finalSummary,
      devLogPath: logger?.getLogPath(),
      devLogSessionId: logger?.getSessionId(),
      conversationId: context.conversationId,
    };
  } catch (error) {
    // Log error
    await logger?.logError(error, 'Study plan import failed');
    
    onEvent({
      type: 'error',
      message: `Failed to import study plan: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
    throw error;
  }
}

// Function to edit an existing goal
export async function editGoalWithAI(
  goalId: string,
  editRequest: string,
  userId: string,
  onEvent: (event: StudyPlanEvent) => void,
  enableDevLogging: boolean = false
) {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-pro-preview-06-05',
    tools: [{ functionDeclarations }],
  });
  
  // Initialize logger if enabled
  let logger: GeminiDevLogger | undefined;
  if (enableDevLogging) {
    logger = new GeminiDevLogger();
    await logger.init();
    await logger.logInfo('Starting goal edit', {
      goalId,
      userId,
      editRequestLength: editRequest.length,
      model: 'gemini-2.5-pro-preview-06-05'
    });
  }
  
  const context: StudyPlanContext = {
    userId,
    mode: 'edit',
    existingGoal: null,
    createdGoal: null,
    createdPhases: [],
    createdResources: [],
    createdActivities: [],
    updatedEntities: [],
    deletedEntities: [],
    onEvent,
    logger,
    conversationId: crypto.randomUUID(),
  };
  
  onEvent({
    type: 'start',
    message: 'Loading your goal and analyzing edit request...',
  });
  
  const systemPrompt = `You are an expert educational planner. Your task is to modify an existing learning goal based on the user's request.

First, use getGoalContext to understand the current state of the goal. Then apply the requested changes using the update, create, and delete functions as needed.

The user's goal ID is: ${goalId}

The user's edit request is:
${editRequest}

Important guidelines:
- First call getGoalContext to load the current goal state
- Preserve existing data unless explicitly asked to change it
- When adding new phases, respect the existing order_index values
- When adding activities, maintain logical ordering within phases
- Only delete items if explicitly requested
- Create new resources as needed for new activities
- Provide clear feedback about what changes were made`;
  
  onEvent({
    type: 'thinking',
    message: 'Loading your goal data and understanding the requested changes...',
  });
  
  try {
    const chat = model.startChat();
    context.chat = chat;
    
    // Send initial prompt
    const requestId = await logger?.logRequest('gemini-2.5-pro-preview-06-05', systemPrompt, {
      goalId,
      mode: 'edit'
    });
    
    const requestStartTime = Date.now();
    let result = await chat.sendMessage(systemPrompt);
    
    await logger?.logResponse(
      requestId || '',
      result.response.text() || '',
      result.response.functionCalls(),
      Date.now() - requestStartTime
    );
    
    // Process function calls
    let iterations = 0;
    const maxIterations = 50;
    
    while (iterations < maxIterations) {
      iterations++;
      
      const functionCalls = result.response.functionCalls();
      const responseText = result.response.text();
      
      if (!functionCalls || functionCalls.length === 0) {
        if (responseText && responseText.length > 0) {
          // AI might be asking for clarification
          onEvent({
            type: 'question',
            message: responseText,
            conversationId: context.conversationId,
            data: { context }
          });
          
          return {
            success: false,
            needsResponse: true,
            question: responseText,
            conversationId: context.conversationId,
            context,
          };
        }
        break;
      }
      
      onEvent({
        type: 'thinking',
        message: `Processing ${functionCalls.length} actions...`,
      });
      
      // Execute function calls
      const functionResponses = [];
      for (const functionCall of functionCalls) {
        try {
          const functionResult = await executeFunctionCall(functionCall, context);
          
          // Store the existing goal when loaded
          if (functionCall.name === 'getGoalContext' && functionResult.success) {
            context.existingGoal = functionResult.goal;
          }
          
          functionResponses.push({
            functionResponse: {
              name: functionCall.name,
              response: functionResult,
            },
          });
        } catch (error) {
          functionResponses.push({
            functionResponse: {
              name: functionCall.name,
              response: { error: error instanceof Error ? error.message : 'Unknown error' },
            },
          });
        }
      }
      
      // Continue conversation
      const contRequestId = await logger?.logRequest(
        'gemini-2.5-pro-preview-06-05',
        JSON.stringify(functionResponses),
        { iteration: iterations, type: 'function_responses' }
      );
      
      const contStartTime = Date.now();
      result = await chat.sendMessage(functionResponses);
      
      await logger?.logResponse(
        contRequestId || '',
        result.response.text() || '',
        result.response.functionCalls(),
        Date.now() - contStartTime
      );
    }
    
    onEvent({
      type: 'complete',
      message: 'Goal update completed successfully!',
      data: {
        goal: context.existingGoal,
        newPhasesCount: context.createdPhases.length,
        newResourcesCount: context.createdResources.length,
        newActivitiesCount: context.createdActivities.length,
        updatesCount: context.updatedEntities.length,
        deletionsCount: context.deletedEntities.length,
      },
    });
    
    const finalSummary = {
      goal: context.existingGoal,
      newPhasesCount: context.createdPhases.length,
      newResourcesCount: context.createdResources.length,
      newActivitiesCount: context.createdActivities.length,
      updatesCount: context.updatedEntities.length,
      deletionsCount: context.deletedEntities.length,
    };
    
    await logger?.logInfo('Goal edit completed', {
      ...finalSummary,
      totalIterations: iterations,
      loggerSummary: logger?.getSummary()
    });
    
    return {
      success: true,
      summary: finalSummary,
      devLogPath: logger?.getLogPath(),
      devLogSessionId: logger?.getSessionId(),
      conversationId: context.conversationId,
    };
  } catch (error) {
    await logger?.logError(error, 'Goal edit failed');
    
    onEvent({
      type: 'error',
      message: `Failed to edit goal: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
    throw error;
  }
}

// Function to continue a conversation with user's response
export async function continueStudyPlanConversation(
  userResponse: string,
  conversationId: string,
  context: StudyPlanContext,
  enableDevLogging: boolean = false
) {
  // Reinitialize logger if needed
  if (enableDevLogging && !context.logger) {
    const logger = new GeminiDevLogger(conversationId);
    await logger.init();
    context.logger = logger;
  }
  
  const logger = context.logger;
  
  // Log user response
  await logger?.logInfo('User provided clarification', {
    response: userResponse,
    conversationId
  });
  
  try {
    // Send user's response to continue the conversation
    const requestId = await logger?.logRequest('continuation', userResponse, {
      conversationId,
      type: 'user_response'
    });
    
    const startTime = Date.now();
    const result = await context.chat.sendMessage(userResponse);
    
    await logger?.logResponse(
      requestId || '',
      result.response.text() || '',
      result.response.functionCalls(),
      Date.now() - startTime
    );
    
    // Continue processing with the existing context
    return parseStudyPlanWithStream(
      userResponse, // This won't be used as we're continuing
      context.userId,
      context.onEvent!,
      enableDevLogging,
      conversationId,
      context
    );
  } catch (error) {
    await logger?.logError(error, 'Conversation continuation failed');
    context.onEvent?.({
      type: 'error',
      message: `Failed to continue conversation: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
    throw error;
  }
}
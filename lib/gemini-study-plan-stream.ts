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
    name: 'getCreatedEntities',
    description: 'Get summary of all created entities',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {},
    },
  },
];

export interface StudyPlanEvent {
  type: 'start' | 'thinking' | 'creating' | 'created' | 'error' | 'complete' | 'question';
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
  createdGoal: any;
  createdPhases: any[];
  createdResources: any[];
  createdActivities: any[];
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
  
  // Emit creating event
  context.onEvent?.({
    type: 'creating',
    entity: name.replace('create', '').toLowerCase() as any,
    data: args,
    message: `Creating ${name.replace('create', '').toLowerCase()}: ${args.title || args.name}`,
  });
  
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
      
      case 'getCreatedEntities': {
        const result = {
          goal: context.createdGoal,
          phases: context.createdPhases.length,
          resources: context.createdResources.length,
          activities: context.createdActivities.length,
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
    createdGoal: null,
    createdPhases: [],
    createdResources: [],
    createdActivities: [],
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
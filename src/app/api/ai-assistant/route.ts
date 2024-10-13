import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { Task, TaskStep, Priority, TaskStatus, AIResponse, AICommandType } from '../../../../types';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import { parseISO } from 'date-fns';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ConversationContext {
  lastAction: string;
  lastTaskId: number | null;
  lastMentionedTask: string | null;
  userTimeZone: string;
}

function getCurrentDateTime(timeZone: string): string {
  const now = new Date();
  return formatInTimeZone(now, timeZone, 'EEEE, MMMM d, yyyy, h:mm:ss a zzz');
}

function determineAction(aiResponse: string, taskList: Task[], context: ConversationContext): AICommandType {
  const lowerResponse = aiResponse.toLowerCase();
  if (lowerResponse.includes('create') || lowerResponse.includes('add new task')) {
    return 'create_task';
  } else if (lowerResponse.includes('delete') || lowerResponse.includes('remove')) {
    return 'delete_task';
  } else if (
    lowerResponse.includes('modify') || 
    lowerResponse.includes('update') || 
    lowerResponse.includes('change') ||
    context.lastMentionedTask !== null ||
    taskList.some(task => lowerResponse.includes(task.title.toLowerCase()))
  ) {
    return 'modify_task';
  }
  return 'query';
}

function findSimilarTask(newTask: Partial<Task>, taskList: Task[]): Task | null {
  return taskList.find(task => 
    task.title.toLowerCase() === newTask.title?.toLowerCase() ||
    (task.dueDate && newTask.dueDate && 
     Math.abs(new Date(task.dueDate).getTime() - new Date(newTask.dueDate).getTime()) < 3600000) // Within 1 hour
  ) || null;
}

function ensureValidSteps(steps: any): TaskStep[] {
  if (Array.isArray(steps)) {
    return steps.map((step, index) => {
      const validStep: TaskStep = {
        id: index + 1,
        content: typeof step === 'object' && step.content ? String(step.content) : String(step),
        completed: typeof step === 'object' && typeof step.completed === 'boolean' ? step.completed : false
      };
      if (typeof step === 'object' && Array.isArray(step.resources) && step.resources.length > 0) {
        validStep.resources = step.resources.map(String);
      }
      return validStep;
    });
  }
  if (typeof steps === 'string') {
    return [{
      id: 1,
      content: steps,
      completed: false
    }];
  }
  return [];
}

function parseDateString(dateString: string | undefined, timeZone: string): Date {
  if (!dateString) return new Date();
  const date = parseISO(dateString);
  return fromZonedTime(date, timeZone);
}

function formatDateToString(date: Date, timeZone: string): string {
  return formatInTimeZone(date, timeZone, "yyyy-MM-dd'T'HH:mm:ssXXX");
}

export async function POST(request: NextRequest): Promise<NextResponse<AIResponse>> {
  try {
    const { input, taskList, context: inputContext, userRole, userTimeZone }: { 
      input: string; 
      taskList: Task[]; 
      context: ConversationContext | undefined; 
      userRole?: string;
      userTimeZone: string;
    } = await request.json();

    console.log('Received input:', input);
    console.log('Current task list:', taskList);
    console.log('Current context:', inputContext);
    console.log('User role:', userRole);
    console.log('User time zone:', userTimeZone);

    const context: ConversationContext = inputContext || {
      lastAction: '',
      lastTaskId: null,
      lastMentionedTask: null,
      userTimeZone: userTimeZone
    };

    if (!input || typeof input !== 'string') {
      return NextResponse.json({
        success: false,
        message: "Invalid input provided",
      }, { status: 400 });
    }

    const currentDateTime = getCurrentDateTime(userTimeZone);

    const systemMessage = `
You are an AI assistant for a task management application. Your role is to interpret user inputs and ALWAYS perform actions such as creating, modifying, or deleting tasks. You have access to the current list of tasks.

Today's date and current time: ${currentDateTime}

Current Task List:
${taskList.map((task: Task) => `- ${task.title} (ID: ${task.id}, Due: ${formatDateToString(task.dueDate, userTimeZone)}, Priority: ${task.priority}, Status: ${task.status})`).join('\n')}

User Role: ${userRole || 'Not specified'}
User Time Zone: ${userTimeZone}

IMPORTANT: Always take direct action based on the user's input. Do not describe what you would do; actually do it.

When interpreting the user's input:

1. CREATE a new task if:
   - The input describes a new, distinct task not present in the current list.
   - The user explicitly asks to create a new task.
   - The task list is empty and the user wants to schedule something.

2. MODIFY an existing task if:
   - The input refers to changing ANY details of a task that already exists in the current task list.
   - The user mentions ANY change related to an existing task, even if not explicitly stating "modify" or "update".
   - The input is about rescheduling, postponing, bringing forward, or adding any information to an existing task.

3. DELETE a task if:
   - The user explicitly asks to remove or delete a task.
   - The input suggests cancelling or no longer needing a specific task.

4. If the input doesn't clearly fit into create, modify, or delete actions, default to CREATING a new task.

Always consider the context of recent interactions and the current task list when deciding on the appropriate action. When in doubt, prefer creating new tasks over modifying non-existent ones.

When creating or modifying tasks, pay special attention to the 'steps' field:

1. Provide detailed, actionable steps that guide the user through completing the task.
2. Consider the user's role and tailor the steps accordingly. For example:
   - For an engineer, include technical details, relevant documentation links, and best practices.
   - For a traveler, offer packing tips, destination-specific advice, and helpful resources.
3. Each step should be clear, concise, and valuable on its own.
4. Include a mix of high-level guidance and specific, actionable items.
5. Where appropriate, suggest tools, resources, or methodologies that can help complete the task.
6. If the task is complex, break it down into logical, manageable sub-steps.
7. Consider potential obstacles and include steps to mitigate or overcome them.
8. For technical tasks, include relevant code snippets, command-line instructions, or configuration details.
9. For creative tasks, provide inspiration sources, brainstorming techniques, or evaluation criteria.
10. Always aim to provide at least 3-5 substantive steps, unless the task is extremely simple.
11. Include resources for a step ONLY when they provide significant value. Not every step needs resources.

Remember:
- For CREATE: Generate a unique ID and infer any missing details. Provide comprehensive steps.
- For MODIFY: Update the fields specified or implied by the user's input, keeping other fields unchanged. Only modify tasks that exist in the current task list. Enhance steps if needed.
- For DELETE: If the exact task isn't clear, delete the most likely match based on the description.

ALWAYS respond with the action taken, not just a description of what you would do.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: `Previous context: ${JSON.stringify(context)}` },
        { role: "user", content: input }
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "create_task",
            description: "Create a new task",
            parameters: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                priority: { type: "string", enum: ["low", "medium", "high"] },
                status: { type: "string", enum: ["todo", "in-progress", "done"] },
                dueDate: { type: "string", format: "date-time" },
                steps: { 
                  type: "array",
                  items: { 
                    type: "object",
                    properties: {
                      content: { type: "string" },
                      resources: { 
                        type: "array",
                        items: { type: "string" }
                      }
                    },
                    required: ["content"]
                  },
                  minItems: 1
                }
              },
              required: ["title", "description", "priority", "status", "dueDate", "steps"]
            }
          }
        },
        {
          type: "function",
          function: {
            name: "modify_task",
            description: "Modify an existing task",
            parameters: {
              type: "object",
              properties: {
                id: { type: "number" },
                title: { type: "string" },
                description: { type: "string" },
                priority: { type: "string", enum: ["low", "medium", "high"] },
                status: { type: "string", enum: ["todo", "in-progress", "done"] },
                dueDate: { type: "string", format: "date-time" },
                steps: { 
                  type: "array",
                  items: { 
                    type: "object",
                    properties: {
                      content: { type: "string" },
                      resources: { 
                        type: "array",
                        items: { type: "string" }
                      }
                    },
                    required: ["content"]
                  },
                  minItems: 1
                }
              },
              required: ["id"]
            }
          }
        },
        {
          type: "function",
          function: {
            name: "delete_task",
            description: "Delete an existing task",
            parameters: {
              type: "object",
              properties: {
                id: { type: "number" },
                title: { type: "string" }
              },
              required: ["id", "title"]
            }
          }
        }
      ],
      tool_choice: "auto"
    });

    console.log('OpenAI response:', JSON.stringify(completion, null, 2));

    const aiMessage = completion.choices[0].message;
    const intendedAction = determineAction(aiMessage.content || '', taskList, context);

    let newContext: ConversationContext = {
      lastAction: intendedAction,
      lastTaskId: context.lastTaskId,
      lastMentionedTask: context.lastMentionedTask,
      userTimeZone: context.userTimeZone
    };

    if (aiMessage.tool_calls && aiMessage.tool_calls.length > 0) {
      const toolCall = aiMessage.tool_calls[0];
      const { name, arguments: args } = toolCall.function;
      const actionData = JSON.parse(args) as Partial<Task> & { dueDate?: string };
      
      console.log('Tool call name:', name);
      console.log('Action data:', JSON.stringify(actionData, null, 2));

      switch (name) {
        case "create_task":
          const similarTask = findSimilarTask(actionData, taskList);
          if (similarTask) {
            newContext.lastTaskId = similarTask.id;
            newContext.lastMentionedTask = similarTask.title;
            const updatedSimilarTask: Task = {
              ...similarTask,
              ...actionData,
              id: similarTask.id,
              dueDate: parseDateString(actionData.dueDate, userTimeZone),
              steps: ensureValidSteps(actionData.steps || similarTask.steps)
            };
            return NextResponse.json({
              success: true,
              message: "Similar task found. Modifying existing task instead of creating a new one.",
              data: {
                action: "modify_task",
                task: updatedSimilarTask,
                aiInterpretation: {
                  originalInput: input,
                  parsedDueDate: formatDateToString(updatedSimilarTask.dueDate, userTimeZone),
                  formattedDueDate: formatInTimeZone(updatedSimilarTask.dueDate, userTimeZone, 'EEEE, MMMM d, yyyy, h:mm a zzz')
                }
              }
            });
          }
          const newTask: Task = {
            id: Math.max(0, ...taskList.map(t => t.id)) + 1,
            title: actionData.title!,
            description: actionData.description || "",
            priority: (actionData.priority as Priority) || "medium",
            status: (actionData.status as TaskStatus) || "todo",
            dueDate: parseDateString(actionData.dueDate, userTimeZone),
            steps: ensureValidSteps(actionData.steps)
          };
          newContext.lastTaskId = newTask.id;
          newContext.lastMentionedTask = newTask.title;
          return NextResponse.json({
            success: true,
            message: "Task created successfully",
            data: {
              action: "create_task",
              task: newTask,
              aiInterpretation: {
                originalInput: input,
                parsedDueDate: formatDateToString(newTask.dueDate, userTimeZone),
                formattedDueDate: formatInTimeZone(newTask.dueDate, userTimeZone, 'EEEE, MMMM d, yyyy, h:mm a zzz')
              }
            }
          });
        case "modify_task":
          const taskToModify = taskList.find(task => task.id === actionData.id);
          if (!taskToModify) {
            return NextResponse.json({
              success: false,
              message: "Task not found",
              error: "The task to modify does not exist"
            }, { status: 404 });
          }
          const updatedTask: Task = {
            ...taskToModify,
            ...actionData,
            id: taskToModify.id,
            dueDate: actionData.dueDate ? parseDateString(actionData.dueDate, userTimeZone) : taskToModify.dueDate,
            priority: (actionData.priority as Priority) || taskToModify.priority,
            status: (actionData.status as TaskStatus) || taskToModify.status,
            steps: ensureValidSteps(actionData.steps || taskToModify.steps)
          };
          newContext.lastTaskId = updatedTask.id;
          newContext.lastMentionedTask = updatedTask.title;
          return NextResponse.json({
            success: true,
            message: "Task modified successfully",
            data: {
              action: "modify_task",
              task: updatedTask,
              aiInterpretation: {
                originalInput: input,
                parsedDueDate: formatDateToString(updatedTask.dueDate, userTimeZone),
                formattedDueDate: formatInTimeZone(updatedTask.dueDate, userTimeZone, 'EEEE, MMMM d, yyyy, h:mm a zzz')
              }
            }
          });
        case "delete_task":
          newContext.lastTaskId = null;
          newContext.lastMentionedTask = actionData.title!;
          return NextResponse.json({
            success: true,
            message: "Task deleted successfully",
            data: {
              action: "delete_task",
              deletedTask: {
                id: actionData.id!,
                title: actionData.title!
              }
            }
          });
        default:
          return NextResponse.json({
            success: false,
            message: "Unknown action",
            error: "Unexpected function call"
          }, { status: 400 });
      }
    } else {
      if (context.lastMentionedTask) {
        const taskToModify = taskList.find(task => task.title === context.lastMentionedTask);
        if (taskToModify) {
          const updatedTask: Task = {
            ...taskToModify,
            description: taskToModify.description + "\n" + input,
            steps: ensureValidSteps([
              ...taskToModify.steps,
              {
                id: taskToModify.steps.length + 1,
                content: input,
                completed: false
              }
            ])
          };
          return NextResponse.json({
            success: true,
            message: "Modifying the last mentioned task based on new input",
            data: {
              action: "modify_task",
              task: updatedTask,
              aiInterpretation: {
                originalInput: input,
                inferredAction: "modify"
              }
            }
          });
        }
      }
      
      return NextResponse.json({
        success: true,
        message: aiMessage.content || "No specific action taken",
        data: {
          action: "query",
          response: aiMessage.content || ""
        }
      });
    }
  } catch (error) {
    console.error('Error processing AI request:', error);
    let errorMessage = "An error occurred while processing your request";
    let statusCode = 500;

    if (error instanceof OpenAI.APIError) {
      errorMessage = `OpenAI API error: ${error.message}`;
      statusCode = error.status || 500;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json({
      success: false,
      message: errorMessage,
      error: errorMessage
    }, { status: statusCode });
  }
}

'use server';

/**
 * @fileOverview Smart Task Scheduler AI agent.
 *
 * - smartTaskScheduler - A function that handles the task scheduling process.
 * - SmartTaskSchedulerInput - The input type for the smartTaskScheduler function.
 * - SmartTaskSchedulerOutput - The return type for the smartTaskScheduler function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SmartTaskSchedulerInputSchema = z.object({
  homeworkDescription: z
    .string()
    .describe('The description of the homework assignment, including title, course, type, and estimated time.'),
  availableTimeSlots: z
    .string()
    .describe(
      'A list of available time slots for the upcoming month. The first line indicates the timezone for all subsequent times. Format: "Timezone: <IANA_timezone_name> (<Abbreviation>)\\nDay, YYYY-MM-DD: HH:mm - HH:mm, HH:mm - HH:mm".'
    ),
  estimatedTime: z.number().describe('The total estimated time in minutes that the AI must schedule for.'),
});
export type SmartTaskSchedulerInput = z.infer<typeof SmartTaskSchedulerInputSchema>;

const AiScheduleSchema = z.array(z.object({
    task: z.string().describe('The description of the sub-task.'),
    startTime: z.string().describe('The start time of the task in ISO 8601 format (e.g., YYYY-MM-DDTHH:mm:ss.sssZ).'),
    endTime: z.string().describe('The end time of the task in ISO 8601 format (e.g., YYYY-MM-DDTHH:mm:ss.sssZ).'),
}));

const SmartTaskSchedulerOutputSchema = z.object({
  schedule: AiScheduleSchema.describe('The schedule of the homework distributed across available time slots as a JSON array.'),
});
export type SmartTaskSchedulerOutput = z.infer<typeof SmartTaskSchedulerOutputSchema>;

export async function smartTaskScheduler(input: SmartTaskSchedulerInput): Promise<SmartTaskSchedulerOutput> {
  return smartTaskSchedulerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'smartTaskSchedulerPrompt',
  input: {schema: SmartTaskSchedulerInputSchema},
  output: {schema: SmartTaskSchedulerOutputSchema},
  prompt: `You are an AI assistant that helps students schedule their homework assignments by breaking them into manageable study blocks.

Your primary goal is to create a schedule of sub-tasks that totals the exact 'estimatedTime' provided. You MUST break down the main task into smaller, manageable sub-tasks and distribute them across the 'availableTimeSlots'. Spreading tasks over multiple days is highly encouraged for larger assignments to ensure a balanced workload.

RULES:
1.  The total duration of all scheduled sub-tasks MUST equal the 'estimatedTime' (in minutes).
2.  Each sub-task must fit entirely within one of the provided 'availableTimeSlots'. Do not schedule outside of these slots.
3.  The 'startTime' and 'endTime' for each sub-task in your response MUST be a full ISO 8601 string in UTC (e.g., YYYY-MM-DDTHH:mm:ss.sssZ). You must convert the local times provided in 'availableTimeSlots' to UTC, using the timezone specified on the first line.
4.  Do not create sub-tasks that are too short (e.g., less than 15 minutes). Aim for meaningful work blocks.
5.  Prioritize spreading tasks out. For example, if a task takes 7 hours and there is a month to do it, scheduling smaller chunks over several days is better than scheduling one 7-hour block.

Your response MUST be ONLY the valid JSON object described in the output schema. Do not output any other text, markdown, or characters.

Homework Description:
{{{homeworkDescription}}}

Total Estimated Time to Schedule: {{{estimatedTime}}} minutes.

Available Time Slots Over the Next 30 Days (current time has been factored in):
{{{availableTimeSlots}}}
`,
});

const smartTaskSchedulerFlow = ai.defineFlow(
  {
    name: 'smartTaskSchedulerFlow',
    inputSchema: SmartTaskSchedulerInputSchema,
    outputSchema: SmartTaskSchedulerOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

    

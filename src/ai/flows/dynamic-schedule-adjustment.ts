'use server';

/**
 * @fileOverview Adjusts the user's schedule dynamically based on their working speed and past performance.
 *
 * - adjustSchedule - Adjusts the schedule based on past performance.
 * - AdjustScheduleInput - The input type for the adjustSchedule function.
 * - AdjustScheduleOutput - The return type for the adjustSchedule function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AdjustScheduleInputSchema = z.object({
  userId: z.string().describe('The ID of the user.'),
  taskId: z.string().describe('The ID of the task to adjust.'),
  estimatedTime: z.number().describe('The initial estimated time for the task in minutes.'),
  actualTime: z.number().describe('The actual time spent on the task in minutes.'),
  schedule: z.string().describe('The current schedule in JSON format.'),
});
export type AdjustScheduleInput = z.infer<typeof AdjustScheduleInputSchema>;

const AdjustScheduleOutputSchema = z.object({
  adjustedSchedule: z.string().describe('The adjusted schedule in JSON format.'),
  newEstimatedTime: z.number().describe('The new estimated time for the task in minutes.'),
});
export type AdjustScheduleOutput = z.infer<typeof AdjustScheduleOutputSchema>;

export async function adjustSchedule(input: AdjustScheduleInput): Promise<AdjustScheduleOutput> {
  return adjustScheduleFlow(input);
}

const adjustSchedulePrompt = ai.definePrompt({
  name: 'adjustSchedulePrompt',
  input: {schema: AdjustScheduleInputSchema},
  output: {schema: AdjustScheduleOutputSchema},
  prompt: `You are an AI schedule assistant that adjusts a user's schedule based on their working speed.

You are provided with the user's ID, task ID, the initial estimated time for the task, the actual time spent on the task, and the current schedule.

Based on the actual time spent on the task compared to the estimated time, adjust the schedule accordingly. Provide the adjusted schedule in JSON format.

User ID: {{{userId}}}
Task ID: {{{taskId}}}
Estimated Time: {{{estimatedTime}}} minutes
Actual Time: {{{actualTime}}} minutes
Current Schedule: {{{schedule}}}

Consider these things when adjusting the schedule:
- If the actual time is significantly less than the estimated time, reduce the estimated time for similar tasks in the future.
- If the actual time is significantly more than the estimated time, increase the estimated time for similar tasks in the future.
- Ensure that the adjusted schedule is still feasible and does not overload the user.

Output the adjusted schedule in JSON format, and the new estimated time for the task.

{{json adjustedSchedule}}
{{newEstimatedTime}}`,
});

const adjustScheduleFlow = ai.defineFlow(
  {
    name: 'adjustScheduleFlow',
    inputSchema: AdjustScheduleInputSchema,
    outputSchema: AdjustScheduleOutputSchema,
  },
  async input => {
    const {output} = await adjustSchedulePrompt(input);
    return output!;
  }
);

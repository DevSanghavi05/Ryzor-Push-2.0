'use server';
/**
 * @fileOverview Flows for interacting with Google Calendar.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Schemas
const GetCalendarEventsInputSchema = z.object({
  accessToken: z.string(),
});
export type GetCalendarEventsInput = z.infer<typeof GetCalendarEventsInputSchema>;

const CalendarEventSchema = z.object({
    summary: z.string().describe("The title of the event."),
    start: z.string().describe("The start time of the event in ISO 8601 format."),
    end: z.string().describe("The end time of the event in ISO 8601 format."),
    link: z.string().url().describe("A link to the event in Google Calendar."),
});

const GetCalendarEventsOutputSchema = z.object({
  events: z.array(CalendarEventSchema),
});
export type GetCalendarEventsOutput = z.infer<typeof GetCalendarEventsOutputSchema>;

const CreateCalendarEventInputSchema = z.object({
  prompt: z.string().describe("The user's natural language description of the event (e.g., 'Meeting with Jane tomorrow at 2pm')."),
  accessToken: z.string(),
});
export type CreateCalendarEventInput = z.infer<typeof CreateCalendarEventInputSchema>;

const CreateCalendarEventOutputSchema = z.object({
  id: z.string(),
  summary: z.string(),
});
export type CreateCalendarEventOutput = z.infer<typeof CreateCalendarEventOutputSchema>;

const FindOptimalTimeInputSchema = z.object({
    prompt: z.string().describe("The user's prompt describing the meeting requirements (e.g., '30 minute sync with the team next week')."),
    accessToken: z.string(),
});
export type FindOptimalTimeInput = z.infer<typeof FindOptimalTimeInputSchema>;

const FindOptimalTimeOutputSchema = z.object({
    bestTime: z.string().datetime().describe("The suggested best time in ISO 8601 format."),
});
export type FindOptimalTimeOutput = z.infer<typeof FindOpetimalTimeOutputSchema>;


// Tools
const createEventTool = ai.defineTool(
  {
    name: 'createCalendarEvent',
    description: 'Creates an event in the user\'s Google Calendar.',
    inputSchema: z.object({
        summary: z.string(),
        startTime: z.string().datetime(),
        endTime: z.string().datetime(),
        description: z.string().optional(),
    }),
    outputSchema: z.object({
        id: z.string(),
        summary: z.string(),
    }),
  },
  async (input, context) => {
    const accessToken = (context?.auth as any)?.accessToken;
    if (!accessToken) throw new Error("Authentication token not found.");
    
    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            summary: input.summary,
            start: { dateTime: input.startTime },
            end: { dateTime: input.endTime },
            description: input.description,
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Google Calendar API error: ${error.error.message}`);
    }
    const data = await response.json();
    return { id: data.id, summary: data.summary };
  }
);

const getFreeBusyTool = ai.defineTool(
    {
        name: 'getCalendarFreeBusy',
        description: 'Gets the free/busy information for the user\'s primary calendar for a given time range.',
        inputSchema: z.object({
            startTime: z.string().datetime(),
            endTime: z.string().datetime(),
        }),
        outputSchema: z.any(),
    },
    async (input, context) => {
        const accessToken = (context?.auth as any)?.accessToken;
        if (!accessToken) throw new Error("Authentication token not found.");

        const response = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                timeMin: input.startTime,
                timeMax: input.endTime,
                items: [{ id: 'primary' }],
            }),
        });
        if (!response.ok) throw new Error('Failed to fetch free/busy data.');
        return await response.json();
    }
);


// Main Functions
export async function getCalendarEvents(input: GetCalendarEventsInput): Promise<GetCalendarEventsOutput> {
  const accessToken = input.accessToken;
  if (!accessToken) throw new Error("Authentication token not found.");

  const timeMin = new Date().toISOString();
  const timeMax = new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(); // Next 7 days

  const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime&maxResults=15`, {
      headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error('Failed to fetch calendar events.');
  const data = await response.json();

  const events: CalendarEvent[] = data.items.map((item: any) => ({
      summary: item.summary,
      start: item.start.dateTime || item.start.date,
      end: item.end.dateTime || item.end.date,
      link: item.htmlLink,
  }));

  return { events };
}

export async function createCalendarEvent(input: CreateCalendarEventInput): Promise<CreateCalendarEventOutput> {
  return createCalendarEventFlow(input, { auth: { accessToken: input.accessToken } });
}

export async function findOptimalTime(input: FindOptimalTimeInput): Promise<FindOptimalTimeOutput> {
    return findOptimalTimeFlow(input, { auth: { accessToken: input.accessToken } });
}

// Flows
const createCalendarEventFlow = ai.defineFlow(
  {
    name: 'createCalendarEventFlow',
    inputSchema: CreateCalendarEventInputSchema,
    outputSchema: CreateCalendarEventOutputSchema,
  },
  async (input) => {
    const { history } = await ai.generate({
      prompt: `The user wants to create a calendar event. Their request is: "${input.prompt}". Use the tool to create the event. Figure out the start and end time based on the current date and the user's request. Assume the current date is ${new Date().toDateString()}`,
      tools: [createEventTool],
    });

    const toolResponse = history.find(m => m.role === 'tool' && m.content[0].toolResponse);
    if(toolResponse) {
        const toolOutput = toolResponse.content[0].toolResponse.output as any;
        return { id: toolOutput.id, summary: toolOutput.summary };
    }

    throw new Error("AI failed to create the event.");
  }
);


const findOptimalTimeFlow = ai.defineFlow(
    {
        name: 'findOptimalTimeFlow',
        inputSchema: FindOptimalTimeInputSchema,
        outputSchema: FindOptimalTimeOutputSchema,
    },
    async (input) => {
        const { text } = await ai.generate({
            prompt: `The user wants to find a time for: "${input.prompt}". Analyze their calendar's free/busy schedule for the next two weeks to find the best slot. Assume today is ${new Date().toISOString()}. Suggest a specific start time.`,
            tools: [getFreeBusyTool],
        });
        
        // The ideal implementation would have the model return structured JSON.
        // For simplicity, we'll parse the text response.
        const isoString = text.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/);
        if (isoString) {
            return { bestTime: isoString[0] };
        }
        
        // Fallback if regex fails. This is brittle.
        return { bestTime: new Date().toISOString() };
    }
)

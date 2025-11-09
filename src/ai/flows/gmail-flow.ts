'use server';
/**
 * @fileOverview Flows for interacting with Gmail.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

// Schemas
const EmailSummary = z.object({
    id: z.string().describe("The unique ID of the email message."),
    from: z.string().describe("The sender of the email."),
    subject: z.string().describe("The subject of the email."),
    summary: z.string().describe("A concise 1-2 sentence summary of the email's content."),
});

const SummarizeEmailsInputSchema = z.object({
  accessToken: z.string(),
  count: z.number().max(20).default(5),
  read: z.boolean().default(false),
});
export type SummarizeEmailsInput = z.infer<typeof SummarizeEmailsInputSchema>;

const SummarizeEmailsOutputSchema = z.object({
  emails: z.array(EmailSummary),
});
export type SummarizeEmailsOutput = z.infer<typeof SummarizeEmailsOutputSchema>;

const DraftReplyInputSchema = z.object({
  prompt: z.string().describe("The user's instruction for the reply."),
  emailContext: z.string().describe("The content of the email to reply to."),
  accessToken: z.string(),
});
export type DraftReplyInput = z.infer<typeof DraftReplyInputSchema>;

const DraftReplyOutputSchema = z.object({
  draft: z.string().describe("The generated email draft in markdown format."),
});
export type DraftReplyOutput = z.infer<typeof DraftReplyOutputSchema>;

// Tools
const getEmailsTool = ai.defineTool(
  {
    name: 'getEmails',
    description: 'Retrieves a list of emails from the user\'s Gmail account.',
    inputSchema: z.object({
      count: z.number().describe("Number of emails to retrieve."),
      read: z.boolean().describe("Whether to fetch read or unread emails."),
    }),
    outputSchema: z.array(z.object({
        id: z.string(),
        snippet: z.string(),
        payload: z.any(),
    })),
  },
  async (input, context) => {
    const accessToken = (context?.auth as any)?.accessToken;
    if (!accessToken) throw new Error("Authentication token not found.");
    
    const query = input.read ? 'is:read' : 'is:unread';
    const response = await fetch(`https://www.googleapis.com/gmail/v1/users/me/messages?maxResults=${input.count}&q=${query}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) throw new Error('Failed to fetch email list from Gmail.');
    const data = await response.json();

    if (!data.messages) return [];

    const emailPromises = data.messages.map(async (msg: any) => {
        const emailRes = await fetch(`https://www.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        return emailRes.json();
    });

    return Promise.all(emailPromises);
  }
);

// Main Functions
export async function summarizeEmails(input: SummarizeEmailsInput): Promise<SummarizeEmailsOutput> {
  return summarizeEmailsFlow(input, { auth: { accessToken: input.accessToken } });
}

export async function draftReply(input: DraftReplyInput): Promise<DraftReplyOutput> {
  return draftReplyFlow(input, { auth: { accessToken: input.accessToken } });
}

// Flows
const summarizeEmailsFlow = ai.defineFlow(
  {
    name: 'summarizeEmailsFlow',
    inputSchema: SummarizeEmailsInputSchema,
    outputSchema: SummarizeEmailsOutputSchema,
  },
  async (input) => {
    const llm = ai.getModel('googleai/gemini-pro');
    const { history } = await llm.generate({
      prompt: `You are a helpful email assistant. Your goal is to summarize the user's latest emails. Fetch the user's ${input.count} most recent ${input.read ? 'read' : 'unread'} emails and provide a concise 1-2 sentence summary for each.`,
      tools: [getEmailsTool],
      toolConfig: {
          json: {
              schema: zodToJsonSchema(SummarizeEmailsOutputSchema)
          }
      }
    });

    const toolCalls = history.filter(msg => msg.role === 'tool' && msg.content[0].toolRequest);
    if (toolCalls.length > 0) {
        // This is a simplified approach. A real implementation would loop until the model provides the final JSON.
        const finalResponse = await llm.generate({
            history: history,
            prompt: `Now, based on the emails you fetched, provide the final summary object.`,
             toolConfig: {
                json: {
                    schema: zodToJsonSchema(SummarizeEmailsOutputSchema)
                }
            }
        });

        if (finalResponse.output?.json) {
            return finalResponse.output.json as SummarizeEmailsOutput;
        }
    }
    
    // Fallback or if the model directly outputs JSON
    const finalLlmOutput = history[history.length - 1];
    if(finalLlmOutput.role === 'model' && finalLlmOutput.content[0].json) {
        return finalLlmOutput.content[0].json as SummarizeEmailsOutput;
    }

    throw new Error("Could not generate email summary.");
  }
);

const draftReplyFlow = ai.defineFlow(
    {
        name: 'draftReplyFlow',
        inputSchema: DraftReplyInputSchema,
        outputSchema: DraftReplyOutputSchema,
    },
    async (input) => {
        const { text } = await ai.generate({
            prompt: `Based on the following email content, write a reply based on the user's instructions.
            
            EMAIL CONTENT:
            ---
            ${input.emailContext}
            ---

            USER INSTRUCTIONS:
            ---
            ${input.prompt}
            ---

            Respond only with the draft of the email.
            `
        });
        return { draft: text };
    }
)

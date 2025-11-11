
'use server';
/**
 * @fileOverview Flows for interacting with Gmail.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

// Schemas
const EmailSchema = z.object({
    id: z.string().describe("The unique ID of the email message."),
    from: z.string().describe("The sender of the email, formatted as 'Name <email@example.com>'."),
    subject: z.string().describe("The subject of the email."),
    snippet: z.string().describe("A short snippet of the email's content."),
    body: z.string().optional().describe("The full body of the email, either in plain text or HTML."),
    date: z.string().describe("The date the email was received in ISO 8601 format."),
});
export type Email = z.infer<typeof EmailSchema>;

const GetEmailsInputSchema = z.object({
  accessToken: z.string(),
  count: z.number().max(50).default(15),
  category: z.enum(['primary', 'unread', 'read', 'sent']).default('primary'),
});
export type GetEmailsInput = z.infer<typeof GetEmailsInputSchema>;

const GetEmailsOutputSchema = z.object({
  emails: z.array(EmailSchema),
});
export type GetEmailsOutput = z.infer<typeof GetEmailsOutputSchema>;


const SummarizeEmailsInputSchema = z.object({
  accessToken: z.string(),
  count: z.number().max(20).default(5),
  read: z.boolean().default(false),
});
export type SummarizeEmailsInput = z.infer<typeof SummarizeEmailsInputSchema>;

const SummarizeEmailsOutputSchema = z.object({
  summary: z.string().describe("A single, concise summary of all the provided emails combined. Should be a few sentences long."),
});
export type SummarizeEmailsOutput = z.infer<typeof SummarizeEmailsOutputSchema>;


const DraftReplyInputSchema = z.object({
  prompt: z.string().describe("The user's instruction for the reply."),
  emailToReplyTo: EmailSchema,
  accessToken: z.string(),
});
export type DraftReplyInput = z.infer<typeof DraftReplyInputSchema>;

const DraftReplyOutputSchema = z.object({
  draft: z.string().describe("The generated email draft in markdown format."),
});
export type DraftReplyOutput = z.infer<typeof DraftReplyOutputSchema>;

const SummarizeSingleEmailInputSchema = z.object({
    email: EmailSchema,
    accessToken: z.string(),
});
export type SummarizeSingleEmailInput = z.infer<typeof SummarizeSingleEmailInputSchema>;

const SummarizeSingleEmailOutputSchema = z.object({
    summary: z.string().describe("A concise summary of the single email provided."),
});
export type SummarizeSingleEmailOutput = z.infer<typeof SummarizeSingleEmailOutputSchema>;

const DraftNewEmailInputSchema = z.object({
  prompt: z.string().describe("The user's instruction for the new email draft."),
  accessToken: z.string(),
});
export type DraftNewEmailInput = z.infer<typeof DraftNewEmailInputSchema>;

const DraftNewEmailOutputSchema = z.object({
    draft: z.string().describe("The generated email draft in markdown format."),
});
export type DraftNewEmailOutput = z.infer<typeof DraftNewEmailOutputSchema>;


const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// Main Functions
export async function getEmails(input: GetEmailsInput): Promise<GetEmailsOutput> {
    const accessToken = input.accessToken;
    if (!accessToken) throw new Error("Authentication token not found.");
    
    let query = 'in:inbox';
    if (input.category === 'unread') query = 'is:unread';
    if (input.category === 'read') query = 'is:read';
    if (input.category === 'sent') query = 'in:sent';


    const listResponse = await fetch(`https://www.googleapis.com/gmail/v1/users/me/messages?maxResults=${input.count}&q=${query}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!listResponse.ok) throw new Error('Failed to fetch email list from Gmail.');
    const listData = await listResponse.json();

    if (!listData.messages) return { emails: [] };

    const emails: Email[] = [];

    for (const msg of listData.messages) {
        await delay(50); // Add a 50ms delay to avoid hitting rate limits
        const emailRes = await fetch(`https://www.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!emailRes.ok) continue;
        const detail = await emailRes.json();
        
        const headers = detail.payload.headers;
        const fromHeader = headers.find((h:any) => h.name.toLowerCase() === 'from')?.value || 'N/A';
        const subjectHeader = headers.find((h:any) => h.name.toLowerCase() === 'subject')?.value || 'No Subject';
        const dateHeader = headers.find((h:any) => h.name.toLowerCase() === 'date')?.value || new Date().toISOString();

        let body = '';
        if (detail.payload.parts) {
            const part = detail.payload.parts.find((p:any) => p.mimeType === 'text/plain') || detail.payload.parts.find((p:any) => p.mimeType === 'text/html');
            if (part && part.body.data) {
                body = Buffer.from(part.body.data, 'base64').toString('utf8');
            }
        } else if (detail.payload.body.data) {
            body = Buffer.from(detail.payload.body.data, 'base64').toString('utf8');
        }

        emails.push({
            id: detail.id,
            from: fromHeader,
            subject: subjectHeader,
            snippet: detail.snippet,
            body: body,
            date: new Date(dateHeader).toISOString(),
        });
    }

    return { emails };
}


export async function summarizeEmails(input: SummarizeEmailsInput): Promise<SummarizeEmailsOutput> {
  return summarizeEmailsFlow(input, { auth: { accessToken: input.accessToken } });
}

export async function summarizeSingleEmail(input: SummarizeSingleEmailInput): Promise<SummarizeSingleEmailOutput> {
    return summarizeSingleEmailFlow(input, { auth: { accessToken: input.accessToken } });
}

export async function draftReply(input: DraftReplyInput): Promise<DraftReplyOutput> {
  return draftReplyFlow(input);
}

export async function draftNewEmail(input: DraftNewEmailInput): Promise<DraftNewEmailOutput> {
    return draftNewEmailFlow(input);
}


// Flows
const summarizeEmailsFlow = ai.defineFlow(
  {
    name: 'summarizeEmailsFlow',
    inputSchema: SummarizeEmailsInputSchema,
    outputSchema: SummarizeEmailsOutputSchema,
  },
  async (input, context) => {
    const accessToken = (context?.auth as any)?.accessToken;
    if (!accessToken) throw new Error("Authentication token not found.");
    
    const { emails } = await getEmails({ accessToken: accessToken, category: input.read ? 'read' : 'unread', count: input.count });

    if (emails.length === 0) {
        return { summary: `No ${input.read ? 'read' : 'unread'} emails found to summarize.`}
    }

    const { text } = await ai.generate({
      prompt: `Summarize the following emails into a single, concise paragraph.
      
      EMAILS:
      ---
      ${JSON.stringify(emails.map(e => ({ from: e.from, subject: e.subject, snippet: e.snippet })))}
      ---
      `,
    });

    return { summary: text };
  }
);


const summarizeSingleEmailFlow = ai.defineFlow(
    {
        name: 'summarizeSingleEmailFlow',
        inputSchema: SummarizeSingleEmailInputSchema,
        outputSchema: SummarizeSingleEmailOutputSchema,
    },
    async (input) => {
        const { text } = await ai.generate({
            prompt: `Provide a concise, one-paragraph summary of the following email.
            
            EMAIL:
            From: ${input.email.from}
            Subject: ${input.email.subject}
            Body:
            ---
            ${input.email.body?.substring(0, 4000)}
            ---
            `,
        });
        return { summary: text };
    }
);


const draftReplyFlow = ai.defineFlow(
    {
        name: 'draftReplyFlow',
        inputSchema: DraftReplyInputSchema,
        outputSchema: DraftReplyOutputSchema,
    },
    async (input) => {
        const { accessToken, emailToReplyTo, prompt } = input;
        
        // 1. Fetch user's sent emails to learn their style
        const { emails: sentEmails } = await getEmails({ accessToken, category: 'sent', count: 5 });

        // 2. Generate the draft using the learned style
        const { text } = await ai.generate({
            prompt: `You are an AI assistant that drafts email replies in the user's personal writing style.

            First, analyze the style (tone, phrasing, formality, length, greeting, sign-off) of these recently sent emails from the user:
            ---
            ${JSON.stringify(sentEmails.map(e => e.body?.substring(0, 1000)))}
            ---

            Now, using that learned style, draft a reply to the following email:
            From: ${emailToReplyTo.from}
            Subject: ${emailToReplyTo.subject}
            Body:
            ---
            ${emailToReplyTo.body?.substring(0, 2000)}
            ---
            
            The user's instruction for the reply is:
            "${prompt}"

            Write the email draft, matching the user's style. Respond ONLY with the body of the email. Do not include a subject line or any other headers.
            `
        });
        return { draft: text };
    }
);

const draftNewEmailFlow = ai.defineFlow(
    {
        name: 'draftNewEmailFlow',
        inputSchema: DraftNewEmailInputSchema,
        outputSchema: DraftNewEmailOutputSchema,
    },
    async (input) => {
        const { text } = await ai.generate({
            prompt: `You are an AI assistant drafting a new email based on the user's instructions.
            
            User's instructions:
            "${input.prompt}"

            Now, write the email draft. Respond ONLY with the body of the email. Do not include a subject line or any other headers.
            `
        });
        return { draft: text };
    }
)

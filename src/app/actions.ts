// @ts-nocheck
'use server';

import { askQuestionGetAnswer } from '@/ai/flows/ask-question-get-answer';
import { redirect } from 'next/navigation';

const initialState = {
  error: null as string | null,
};

export async function processPdf(prevState: typeof initialState, formData: FormData) {
  const file = formData.get('pdf') as File;

  if (!file || file.size === 0 || file.type !== 'application/pdf') {
    return { error: 'Please select a valid PDF file.' };
  }

  // Simulate upload and processing time
  console.log(`Processing ${file.name}...`);
  await new Promise(resolve => setTimeout(resolve, 2500));
  
  const fileId = `doc-${Date.now()}`;
  console.log(`Processing complete. File ID: ${fileId}`);
  
  // Redirect to the chat page for the new document
  redirect(`/chat/${fileId}`);
}


export async function askQuestion(fileId: string, question: string): Promise<{ success: boolean; answer?: string; error?: string }> {
  if (!question.trim()) {
    return { success: false, error: 'Question cannot be empty.' };
  }
  
  console.log(`Asking question about file ${fileId}: "${question}"`);

  // In a real application, you would retrieve chunks from a vector database
  // based on the fileId and question similarity.
  // For this MVP, we use mocked chunks.
  const relevantChunks = [
    "Ryzor AI is an innovative platform designed to help users interact with their PDF documents through a conversational AI interface.",
    "The core technology involves parsing PDF documents, splitting them into manageable text chunks, and then using Retrieval-Augmented Generation (RAG) to answer user questions.",
    "The MVP (Minimum Viable Product) focuses on a single-file upload workflow. A user uploads a PDF, which is then processed on the backend. Once processed, the user can ask questions related to the document's content.",
    "Future enhancements for Ryzor AI include multi-document chat, user authentication for private document storage, and providing source citations with answers to improve trustworthiness.",
    "The AI model used is GPT-4o-mini, which offers a good balance of performance, intelligence, and cost-effectiveness for this application."
  ];

  try {
    const result = await askQuestionGetAnswer({
      question: question,
      relevantChunks: relevantChunks,
    });
    return { success: true, answer: result.answer };
  } catch (e) {
    console.error('AI Error:', e);
    return { success: false, error: 'The AI failed to generate a response. Please try again.' };
  }
}

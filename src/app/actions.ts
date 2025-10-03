// @ts-nocheck
'use server';

import { askQuestionGetAnswer } from '@/ai/flows/ask-question-get-answer';
import { getChunks } from '@/ai/flows/get-chunks-from-text';
import { redirect } from 'next/navigation';

const initialState = {
  error: null as string | null,
};

// Simple in-memory cache for document text
const documentCache = new Map<string, string>();


export async function processPdf(prevState: typeof initialState, formData: FormData) {
  const file = formData.get('pdf') as File;

  if (!file || file.size === 0 || file.type !== 'application/pdf') {
    return { error: 'Please select a valid PDF file.' };
  }

  console.log(`Processing ${file.name}...`);
  
  try {
    const pdf = (await import('pdf-parse/lib/pdf-parse.js')).default;
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const pdfData = await pdf(fileBuffer);
    
    const fileId = `doc-${Date.now()}`;
    documentCache.set(fileId, pdfData.text);
    
    console.log(`Processing complete. File ID: ${fileId}`);
    
    // Redirect to the chat page for the new document
    redirect(`/chat/${fileId}`);
  } catch (error) {
    console.error('Error processing PDF:', error);
    return { error: 'Failed to process the PDF file. It might be corrupted or protected.' };
  }
}


export async function askQuestion(fileId: string, question: string): Promise<{ success: boolean; answer?: string; error?: string }> {
  if (!question.trim()) {
    return { success: false, error: 'Question cannot be empty.' };
  }
  
  console.log(`Asking question about file ${fileId}: "${question}"`);

  const documentText = documentCache.get(fileId);

  if (!documentText) {
    return { success: false, error: 'Document not found. Please upload it again.' };
  }

  try {
    // 1. Get relevant chunks from the document
    const { chunks } = await getChunks({
      text: documentText,
      query: question,
    });
    
    // 2. Answer the question based on the chunks
    const result = await askQuestionGetAnswer({
      question: question,
      relevantChunks: chunks,
    });

    return { success: true, answer: result.answer };
  } catch (e) {
    console.error('AI Error:', e);
    return { success: false, error: 'The AI failed to generate a response. Please try again.' };
  }
}

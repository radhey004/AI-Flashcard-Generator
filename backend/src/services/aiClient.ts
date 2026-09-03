import axios from 'axios';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export async function generateFlashcardsFromText(payload: { text: string; difficulty: string; count: number }) {
    const response = await axios.post(`${AI_SERVICE_URL}/generate/text`, payload, { timeout: 120000 });
    return response.data;
}

export async function generateFlashcardsFromPdf(payload: { pdf_base64: string; filename: string; difficulty: string; count: number }) {
    const response = await axios.post(`${AI_SERVICE_URL}/generate/pdf`, payload, { timeout: 180000 });
    return response.data;
}

export async function generateFlashcardsFromYouTube(payload: { url: string; difficulty: string; count: number }) {
    const response = await axios.post(`${AI_SERVICE_URL}/generate/youtube`, payload, { timeout: 180000 });
    return response.data;
}
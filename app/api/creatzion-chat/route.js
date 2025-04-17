import { NextResponse } from 'next/server';

export async function POST(req) {
  const { messages } = await req.json();
  const apiKey = process.env.GEMINI_API_KEY;

  const userMessage = messages?.[messages.length - 1]?.content || 'How can I manage my salary?';

  const prompt = `
You are Creatzion AI, a smart financial assistant.

Always answer ONLY finance-related questions. When a user gives their salary or asks about saving or budgeting, give them a friendly and practical response.

User: "${userMessage}"
`;

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt.trim() }],
            },
          ],
        }),
      }
    );

    const geminiData = await geminiRes.json();

    const reply =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ??
      'Sorry, I could not generate a meaningful financial response.';

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Gemini error:', error);
    return NextResponse.json({ error: 'Failed to fetch from Gemini' }, { status: 500 });
  }
}

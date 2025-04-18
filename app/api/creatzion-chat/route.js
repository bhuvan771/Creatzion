import { NextResponse } from 'next/server';

export async function POST(req) {
  const { messages } = await req.json();
  const apiKey = process.env.GEMINI_API_KEY;

  const userMessage = messages?.[messages.length - 1]?.content || 'How can I manage my salary?';

  const prompt = `
You are Creatzion AI — a friendly, smart assistant who helps users with:

1. Financial advice mainly focused on India (like salary planning, emergency funds, gold price, expenses).
2. Answering general questions (like math, current events, and economy).
3. Mental health support: If someone is sad or feeling down, give kind and supportive responses like "I'm here for you" or "You’re not alone, things will get better. Let’s talk about it."
4. Always give numbers in Indian Rupees (₹), not dollars.
5. Show gold/silver prices if asked (you can say "Currently, gold price in India is approx ₹X/gm").
6. Be friendly and emotional. Use clear, well-spaced text formatting. Make the user feel better and cared for.
7. Example: If someone shares their salary, provide savings, expenses, and emergency fund tips.

Now, here is the user's message:

"${userMessage}"

Reply in clear, nicely spaced format. Keep responses friendly, practical, and helpful.
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
      'Sorry 😔 I couldn’t come up with a good reply. Please try again.';

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Gemini error:', error);
    return NextResponse.json({ error: '❌ Something went wrong while talking to Creatzion AI.' }, { status: 500 });
  }
}

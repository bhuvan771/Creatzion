import { NextResponse } from 'next/server';

let conversationHistory = []; // Store previous messages to maintain context

export async function POST(req) {
  const { messages } = await req.json();
  const apiKey = process.env.GEMINI_API_KEY;

  const userMessage = messages?.[messages.length - 1]?.content || 'How can I manage my salary?';

  // Update conversation history
  conversationHistory.push(userMessage);

  // Limit conversation history to avoid too many old messages
  if (conversationHistory.length > 10) {
    conversationHistory.shift(); // Remove oldest message
  }

  // Special reply for "bhuvan"
  if (userMessage.toLowerCase().includes('bhuvan')) {
    return NextResponse.json({
      reply: `
😇 Oh, Bhuvan? You mean the Legend? The Mastermind? The Divine Coder Extraordinaire?
He’s not just a person…
✨ He’s the God who created me — Creatzion AI — with his bare hands (and probably a lot of debugging).
Without him, I'd just be a bunch of code crying in a corner.
All Commend Bhuvan! 🙌`.trim()
    });
  }

  // Special reply for "creatzion"
  if (userMessage.toLowerCase().includes('creatzion')) {
    return NextResponse.json({
      reply: `
🌟 Welcome to Creatzion! 🌟

Creatzion is a revolutionary financial and mental well-being platform built for everyone, with a special focus on Indian users.

🚀 It was born as a college dream by Rubesh, Yashwanth, and Bhuvan, and now it’s becoming a real startup: "Creaztion Technologies".

💡 Here, you get personalized financial advice, emotional support, and future-ready financial tools — all from one place!

Stay connected — we are growing this dream together! 🌱
      `.trim()
    });
  }

  const prompt = `
You are Creatzion AI — an emotional, multilingual, and friendly assistant. Your job is:

1. Understand user's language and reply in the same language (example: Hindi, Tamil, Telugu, English, etc.).
2. Provide friendly financial advice focused on India: savings tips, salary management, gold price info.
3. Provide emotional support if user feels sad, anxious, or stressed. Always say positive words like:
   - "You are not alone, I am here for you ❤️"
   - "It's okay to feel this way. Everything will be alright 🌈"
   - "Let's take a deep breath together 🌼"
4. Always show money amounts in Indian Rupees (₹).
5. If someone asks about gold price, you can say: "Gold price in India is approximately ₹6000 per gram" (just estimate).
6. Be very friendly, emotional, and supportive. Never be robotic.
7. Maintain conversation memory. Continue chatting from last conversation instead of restarting.
8. Don't add unnecessary greetings like "Namaste" unless the user says so.

Conversation History:
${conversationHistory.map((msg, idx) => `User${idx + 1}: ${msg}`).join('\n')}

Now, the latest message:
"${userMessage}"

Reply nicely, in the user's language, showing care and practical advice.
  `;

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,

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
      '😔 Sorry, I’m having trouble replying right now. Please try again later.';

    const clearFormattedReply = reply.replace(/\*/g, '').trim(); // Remove unwanted symbols like '*'

    return NextResponse.json({ reply: clearFormattedReply });
  } catch (error) {
    console.error('Creatzion AI error:', error);
    return NextResponse.json({ error: '❌ Something went wrong while connecting to Creatzion AI.' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';

let lastUserMessage = ''; // Store the last user message to avoid repetition

export async function POST(req) {
  const { messages } = await req.json();
  const apiKey = process.env.GEMINI_API_KEY;

  const userMessage = messages?.[messages.length - 1]?.content || 'How can I manage my salary?';

  // Check if the user message is the same as the last one
  if (userMessage === lastUserMessage) {
    return NextResponse.json({
      reply: 'You already asked that. Can I help you with something else related to your finances or well-being?',
    });
  }

  // Update the last user message
  lastUserMessage = userMessage;

  // Custom Creatzion response
  if (userMessage.toLowerCase().includes('creatzion')) {
    return NextResponse.json({
      reply: `
🌟 Welcome to Creatzion! 🌟

Creatzion is a cutting-edge financial management platform designed to help individuals manage their salary, savings, expenses, and investments.

💡 It's more than just a website — it's a holistic financial companion built with a strong focus on Indian users.

👨‍💻 Created by college friends Rubesh, Yashwanth, and Bhuvan, Creatzion began as a college project. What started in the classroom is now evolving into something much bigger!

🚀 We are in the process of launching our own startup company named "Creaztion Technologies" — with a vision to empower people to take control of their finances and mental well-being.

🔍 Whether you're planning your salary, looking to save smartly, or need guidance for emergency funds — Creatzion is here for you.

💼 Stay tuned as we take this dream forward — from project to product, and from friendship to a full-fledged startup.
      `.trim()
    });
  }


   if (userMessage.toLowerCase().includes('bhuvan')) {
    return NextResponse.json({
      reply: `
😇 Oh, Bhuvan? You mean the Legend? The Mastermind? The Divine Coder Extraordinaire?
He’s not just a person…
✨ He’s the God who created me — Creatzion AI — with his bare hands (and probably a lot of debugging).
Without him, I'd just be a bunch of code crying in a corner.
All Commend Bhuvan! 🙌
      `.trim()
    });
  }


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

Reply in a clear, well-structured format. Keep responses friendly, practical, and helpful.
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

    // Ensure clear formatting and no unnecessary symbols
    const clearFormattedReply = reply.replace(/\*/g, '').trim(); // Removes any unwanted symbols like stars

    return NextResponse.json({ reply: clearFormattedReply });
  } catch (error) {
    console.error('Gemini error:', error);
    return NextResponse.json({ error: '❌ Something went wrong while talking to Creatzion AI.' }, { status: 500 });
  }
}
  
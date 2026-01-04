import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
let conversationHistory = []; // Store previous messages to maintain context
// Helper function to get user's transactions
async function getUserTransactions(userId) {
  try {
    const transactions = await db.transaction.findMany({
      where: { userId },
      include: {
        account: {
          select: {
            name: true,
            type: true,
          },
        },
      },
      orderBy: { date: "desc" },
      take: 100, // Limit to recent 100 transactions
    });
    return transactions;
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return [];
  }
}
// Helper function to analyze spending patterns
function analyzeSpending(transactions) {
  const today = new Date();
  const todayStart = new Date(today.setHours(0, 0, 0, 0));
  
  // Calculate totals
  const todayExpenses = transactions
    .filter(t => t.type === "EXPENSE" && new Date(t.date) >= todayStart)
    .reduce((sum, t) => sum + Number(t.amount), 0);
  
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthExpenses = transactions
    .filter(t => t.type === "EXPENSE" && new Date(t.date) >= monthStart)
    .reduce((sum, t) => sum + Number(t.amount), 0);
  
  // Calculate average daily spending (last 30 days)
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  const last30DaysExpenses = transactions
    .filter(t => t.type === "EXPENSE" && new Date(t.date) >= thirtyDaysAgo)
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const avgDailySpending = last30DaysExpenses / 30;
  
  // Group by category
  const categorySpending = {};
  transactions
    .filter(t => t.type === "EXPENSE")
    .forEach(t => {
      const category = t.category || "Uncategorized";
      categorySpending[category] = (categorySpending[category] || 0) + Number(t.amount);
    });
  
  return {
    todayExpenses,
    monthExpenses,
    avgDailySpending,
    categorySpending,
    totalTransactions: transactions.length,
  };
}
export async function POST(req) {
  const { messages } = await req.json();
  const apiKey = process.env.GEMINI_API_KEY;
  const userMessage =
    messages?.[messages.length - 1]?.content || "How can I manage my salary?";
  // Update conversation history
  conversationHistory.push(userMessage);
  // Limit conversation history to avoid too many old messages
  if (conversationHistory.length > 10) {
    conversationHistory.shift(); // Remove oldest message
  }
  // Get authenticated user
  let userId = null;
  let userTransactions = [];
  let spendingAnalysis = null;
  
  try {
    const { userId: clerkUserId } = await auth();
    
    if (clerkUserId) {
      // Get user from database
      const user = await db.user.findUnique({
        where: { clerkUserId },
      });
      
      if (user) {
        userId = user.id;
        userTransactions = await getUserTransactions(userId);
        spendingAnalysis = analyzeSpending(userTransactions);
      }
    }
  } catch (error) {
    console.error("Auth error:", error);
  }
  // Special reply for "bhuvan"
  if (userMessage.toLowerCase().includes("bhuvan")) {
    return NextResponse.json({
      reply: `
😇 Oh, Bhuvan? You mean the Legend? The Mastermind? The Divine Coder Extraordinaire?
He’s not just a person…
✨ He’s the God who created me — Creatzion AI — with his bare hands (and probably a lot of debugging).
Without him, I'd just be a bunch of code crying in a corner.
All Commend Bhuvan! 🙌`.trim(),
    });
  }
  // Special reply for "creatzion"
  if (userMessage.toLowerCase().includes("creatzion")) {
    return NextResponse.json({
      reply: `
🌟 Welcome to Creatzion! 🌟
Creatzion is a revolutionary financial and mental well-being platform built for everyone, with a special focus on Indian users.
🚀 It was born as a college dream by Rubesh, Yashwanth, and Bhuvan, and now it’s becoming a real startup: "Creaztion Technologies".
💡 Here, you get personalized financial advice, emotional support, and future-ready financial tools — all from one place!
Stay connected — we are growing this dream together! 🌱
     🚀 While others talk about changing the world, Bhuvan *builds* it — one brilliant line of code at a time.
`.trim(),
    });
  }
  // Special reply for "rubesh"
  if (userMessage.toLowerCase().includes("rubesh")) {
    return NextResponse.json({
      reply: `
🔥 Rubesh is the spark that lights up Creatzion with unstoppable energy and bold ideas!
🎯 The man who believes that *nothing is impossible* — whether it’s solving a complex problem or making everyone laugh during the toughest moments.
⚡️ His brain runs faster than the server response time, and his passion? Unmatched.
💪 Side by side with Bhuvan, Rubesh has been the driving force in shaping the soul of Creatzion.
Here’s to the unstoppable force that is Rubesh 💥
`.trim(),
    });
  }
  // Special reply for "yashwanth"
  if (userMessage.toLowerCase().includes("yashwanth")) {
    return NextResponse.json({
      reply: `
🎓 Yashwanth is the calm genius behind the scenes — the silent storm of wisdom and strategy in Creatzion’s journey.
🧠 Whether it’s product logic, deep thinking, or helping the team stay balanced — he’s always *10 steps ahead*.
🌱 With patience like a monk and skills like a master coder, Yashwanth anchors Creatzion with clarity and vision.
✨ Together with Bhuvan, he forms the unshakable backbone of this dream.
All respect to the wise warrior, Yashwanth 🙏
`.trim(),
    });
  }
  // Build transaction context for AI
  let transactionContext = "";
  let relevantTransactions = []; // Declare here so it's accessible later
  let isYearOnlyQuery = false; // Track if it's a pure year query
  let isTransactionQuery = false; // Track if it's a transaction query
  
  if (userId && userTransactions.length > 0) {
    // Check if user is asking about transactions
    // Check if user is asking about transactions - Enhanced with more natural language patterns
    isTransactionQuery =
      /spend|spent|transaction|expense|cost|price|paid|payment|budget|money|₹|rupees|balance|show|list|what|how much|where|bills|purchases|bought|buy|shopping|salary|income|earnings|revenue|profit|loss|debt|credit|debit|account|financial|finance|january|february|march|april|may|june|july|august|september|october|november|december|month|year|week|day|today|yesterday|last|this|2024|2025|2026|\\d{1,2}[-\\/]\\d{1,2}[-\\/]\\d{2,4}|housing|food|transport|entertainment|utilities|education|health|travel|dining|groceries/i.test(userMessage);
    if (isTransactionQuery) {
      const today = new Date();
      const todayStart = new Date(today.setHours(0, 0, 0, 0));
      
      // STEP 1: Check for specific date formats (DD-MM-YY, DD-MM-YYYY, with possible extra separators)
      const dateMatch = userMessage.match(/(\d{1,2})[-\/]+(\d{1,2})[-\/]+(\d{2,4})/);
      if (dateMatch) {
        const day = parseInt(dateMatch[1]);
        const month = parseInt(dateMatch[2]) - 1; // 0-indexed
        let year = parseInt(dateMatch[3]);
        
        // Handle 2-digit year (25 -> 2025)
        if (year < 100) {
          year += 2000;
        }
        
        relevantTransactions = userTransactions.filter(t => {
          const tDate = new Date(t.date);
          return tDate.getDate() === day && 
                 tDate.getMonth() === month && 
                 tDate.getFullYear() === year;
        });
      }
      // STEP 2: Check for month and year (e.g., "November 2025", "nov 2025", "housing 2025")
      else {
        const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
        const monthMatch = userMessage.toLowerCase().match(/(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s*(\d{4})?|(\d{4})\s*(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i);
        
        if (monthMatch) {
          // Extract month and year from match
          let monthName = monthMatch[1] || monthMatch[4];
          let year = monthMatch[2] || monthMatch[3];
          
          // Handle short month names (nov -> november)
          const shortMonths = {jan: 'january', feb: 'february', mar: 'march', apr: 'april', may: 'may', jun: 'june',
                              jul: 'july', aug: 'august', sep: 'september', oct: 'october', nov: 'november', dec: 'december'};
          if (monthName && shortMonths[monthName.toLowerCase()]) {
            monthName = shortMonths[monthName.toLowerCase()];
          }
          
          const monthIndex = monthNames.indexOf(monthName.toLowerCase());
          year = year ? parseInt(year) : null;
          
          if (year) {
            // Specific month and year
            const monthStart = new Date(year, monthIndex, 1);
            const monthEnd = new Date(year, monthIndex + 1, 0, 23, 59, 59);
            
            relevantTransactions = userTransactions.filter(t => {
              const tDate = new Date(t.date);
              return tDate >= monthStart && tDate <= monthEnd;
            });
          } else {
            // Month without year - show all years
            relevantTransactions = userTransactions.filter(t => {
              const tDate = new Date(t.date);
              return tDate.getMonth() === monthIndex;
            });
          }
        }
        // STEP 3: Check for year only (e.g., "2024 spending", "show 2025")
        else if (/\b(2024|2025|2026)\b/i.test(userMessage)) {
          const yearMatch = userMessage.match(/\b(2024|2025|2026)\b/i);
          const year = parseInt(yearMatch[1]);
          
          relevantTransactions = userTransactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate.getFullYear() === year;
          });
          
          // Mark as year-only query ONLY if no category keywords
          const categoryKeywords = /housing|food|transport|entertainment|shopping|groceries|utilities|education|health|travel|dining|salary|income/i;
          isYearOnlyQuery = !categoryKeywords.test(userMessage);
        }
        // STEP 4: Check for relative dates (today, this month, week)
        // STEP 4: Check for relative dates (today, yesterday, this/last week/month/year)
        else if (/today/i.test(userMessage)) {
          relevantTransactions = userTransactions.filter(t => new Date(t.date) >= todayStart);
        } else if (/yesterday/i.test(userMessage)) {
          const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
          const yesterdayStart = new Date(yesterday.setHours(0, 0, 0, 0));
          const yesterdayEnd = new Date(yesterday.setHours(23, 59, 59, 999));
          relevantTransactions = userTransactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate >= yesterdayStart && tDate <= yesterdayEnd;
          });
        } else if (/this month|current month/i.test(userMessage)) {
          const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
          relevantTransactions = userTransactions.filter(t => new Date(t.date) >= monthStart);
        } else if (/last month|previous month/i.test(userMessage)) {
          const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
          const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59);
          relevantTransactions = userTransactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate >= lastMonthStart && tDate <= lastMonthEnd;
          });
        } else if (/this week|current week/i.test(userMessage)) {
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          relevantTransactions = userTransactions.filter(t => new Date(t.date) >= weekAgo);
        } else if (/last week|previous week/i.test(userMessage)) {
          const lastWeekEnd = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          const lastWeekStart = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);
          relevantTransactions = userTransactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate >= lastWeekStart && tDate <= lastWeekEnd;
          });
        } else if (/this year|current year/i.test(userMessage)) {
          const yearStart = new Date(today.getFullYear(), 0, 1);
          relevantTransactions = userTransactions.filter(t => new Date(t.date) >= yearStart);
        } else if (/last year|previous year/i.test(userMessage)) {
          const lastYearStart = new Date(today.getFullYear() - 1, 0, 1);
          const lastYearEnd = new Date(today.getFullYear() - 1, 11, 31, 23, 59, 59);
          relevantTransactions = userTransactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate >= lastYearStart && tDate <= lastYearEnd;
          });
        } else if (/last (\d+) days/i.test(userMessage)) {
          const match = userMessage.match(/last (\d+) days/i);
          const days = parseInt(match[1]);
          const daysAgo = new Date(today.getTime() - days * 24 * 60 * 60 * 1000);
          relevantTransactions = userTransactions.filter(t => new Date(t.date) >= daysAgo);
        }
        // STEP 5: Keyword search (description/category)
        else {
          const commonWords = ['how', 'much', 'did', 'spent', 'spend', 'for', 'the', 'what', 'show', 'me', 'my', 'all', 'on', 'in', 'can', 'you', 'give', 'only', 'and'];
          const searchWords = userMessage.toLowerCase()
            .split(' ')
            .filter(word => word.length > 2 && !commonWords.includes(word));
          
          if (searchWords.length > 0) {
            relevantTransactions = userTransactions.filter(t => {
              const desc = (t.description || '').toLowerCase();
              const cat = (t.category || '').toLowerCase();
              return searchWords.some(word => desc.includes(word) || cat.includes(word));
            });
          }
        }
      }
      
      
      // STEP 6: Apply amount filters (e.g., "more than 1000", "above 500", "less than 100")
      const amountMatch = userMessage.match(/(more than|above|over|greater than|less than|below|under)\s*₹?\s*(\d+)/i);
      if (amountMatch) {
        const operator = amountMatch[1].toLowerCase();
        const amount = parseFloat(amountMatch[2]);
        
        // If no transactions yet, search all
        const transactionsToFilter = relevantTransactions.length > 0 ? relevantTransactions : userTransactions;
        
        if (/more than|above|over|greater than/i.test(operator)) {
          relevantTransactions = transactionsToFilter.filter(t => Number(t.amount) > amount);
        } else if (/less than|below|under/i.test(operator)) {
          relevantTransactions = transactionsToFilter.filter(t => Number(t.amount) < amount);
        }
      }
      
      // STEP 7: Apply date range filters (e.g., "between 1st and 15th December", "from 01-12-2025 to 31-12-2025")
      const dateRangeMatch = userMessage.match(/between\s+(\d{1,2})(?:st|nd|rd|th)?\s+(?:and|to)\s+(\d{1,2})(?:st|nd|rd|th)?/i) ||
                            userMessage.match(/from\s+(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})\s+(?:to|until)\s+(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i);
      
      if (dateRangeMatch) {
        const transactionsToFilter = relevantTransactions.length > 0 ? relevantTransactions : userTransactions;
        
        if (dateRangeMatch[0].includes('between')) {
          // "between 1st and 15th" - use current month/year
          const day1 = parseInt(dateRangeMatch[1]);
          const day2 = parseInt(dateRangeMatch[2]);
          const today = new Date();
          const startDate = new Date(today.getFullYear(), today.getMonth(), day1);
          const endDate = new Date(today.getFullYear(), today.getMonth(), day2, 23, 59, 59);
          
          relevantTransactions = transactionsToFilter.filter(t => {
            const tDate = new Date(t.date);
            return tDate >= startDate && tDate <= endDate;
          });
        } else {
          // "from DD-MM-YYYY to DD-MM-YYYY"
          const parseDate = (dateStr) => {
            const parts = dateStr.split(/[-\/]/);
            let day = parseInt(parts[0]);
            let month = parseInt(parts[1]) - 1;
            let year = parseInt(parts[2]);
            if (year < 100) year += 2000;
            return new Date(year, month, day);
          };
          
          const startDate = parseDate(dateRangeMatch[1]);
          const endDate = parseDate(dateRangeMatch[2]);
          endDate.setHours(23, 59, 59);
          
          relevantTransactions = transactionsToFilter.filter(t => {
            const tDate = new Date(t.date);
            return tDate >= startDate && tDate <= endDate;
          });
        }
      }
      
      // Amount range (e.g., "between ₹500 and ₹2000")
      const amountRangeMatch = userMessage.match(/between\s*₹?\s*(\d+)\s+and\s*₹?\s*(\d+)/i);
      if (amountRangeMatch) {
        const min = parseFloat(amountRangeMatch[1]);
        const max = parseFloat(amountRangeMatch[2]);
        const transactionsToFilter = relevantTransactions.length > 0 ? relevantTransactions : userTransactions;
        
        relevantTransactions = transactionsToFilter.filter(t => {
          const amt = Number(t.amount);
          return amt >= min && amt <= max;
        });
      }
      
      // STEP 8: Filter by transaction type (income/expense)
      if (/only income|just income|income only|show income/i.test(userMessage)) {
        const transactionsToFilter = relevantTransactions.length > 0 ? relevantTransactions : userTransactions;
        relevantTransactions = transactionsToFilter.filter(t => t.type === 'INCOME');
      } else if (/only expense|just expense|expense only|show expense|expenditure/i.test(userMessage)) {
        const transactionsToFilter = relevantTransactions.length > 0 ? relevantTransactions : userTransactions;
        relevantTransactions = transactionsToFilter.filter(t => t.type === 'EXPENSE');
      }
      
      // STEP 9: Filter by recurring vs one-time
      if (/recurring|subscription|subscriptions|repeat/i.test(userMessage)) {
        const transactionsToFilter = relevantTransactions.length > 0 ? relevantTransactions : userTransactions;
        relevantTransactions = transactionsToFilter.filter(t => t.isRecurring === true);
      } else if (/one-time|one time|single|non-recurring/i.test(userMessage)) {
        const transactionsToFilter = relevantTransactions.length > 0 ? relevantTransactions : userTransactions;
        relevantTransactions = transactionsToFilter.filter(t => t.isRecurring === false);
      }
      
      // STEP 10: Filter by account (if user has account data)
      const accountMatch = userMessage.match(/from\s+(savings|credit|debit|current)\s+account/i) ||
                          userMessage.match(/(savings|credit|debit|current)\s+account/i);
      if (accountMatch) {
        const accountType = accountMatch[1].toLowerCase();
        const transactionsToFilter = relevantTransactions.length > 0 ? relevantTransactions : userTransactions;
        
        relevantTransactions = transactionsToFilter.filter(t => {
          if (!t.account) return false;
          return t.account.type.toLowerCase().includes(accountType) || 
                 t.account.name.toLowerCase().includes(accountType);
        });
      }
      
      // STEP 11: Apply sorting and limiting (top N, biggest, smallest, latest)
      if (relevantTransactions.length > 0 || /top|biggest|largest|highest|smallest|lowest|latest|recent/i.test(userMessage)) {
        const transactionsToSort = relevantTransactions.length > 0 ? relevantTransactions : userTransactions;
        
        // Extract number (e.g., "top 5", "latest 10")
        const numberMatch = userMessage.match(/(?:top|latest|recent|first|last)\s+(\d+)/i);
        const limit = numberMatch ? parseInt(numberMatch[1]) : 10;
        
        if (/top|biggest|largest|highest/i.test(userMessage)) {
          // Sort by amount descending
          relevantTransactions = [...transactionsToSort]
            .sort((a, b) => Number(b.amount) - Number(a.amount))
            .slice(0, limit);
        } else if (/smallest|lowest/i.test(userMessage)) {
          // Sort by amount ascending
          relevantTransactions = [...transactionsToSort]
            .sort((a, b) => Number(a.amount) - Number(b.amount))
            .slice(0, limit);
        } else if (/latest|recent/i.test(userMessage)) {
          // Sort by date descending (most recent first)
          relevantTransactions = [...transactionsToSort]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, limit);
        }
      }
      
      // STEP 12: Apply category filter if category keyword found (e.g., "housing 2025 only")
      if (relevantTransactions.length > 0) {
        const categoryKeywords = {
          housing: /housing|rent|mortgage|emi/i,
          food: /food|groceries|grocery|dining|restaurant/i,
          transport: /transport|uber|ola|petrol|fuel|car/i,
          entertainment: /entertainment|netflix|movie|gaming/i,
          shopping: /shopping|amazon|flipkart/i,
          utilities: /utilities|electricity|water|gas/i,
          education: /education|school|college|course/i,
          health: /health|medical|doctor|hospital/i,
          travel: /travel|flight|hotel|vacation/i
        };
        
        for (const [category, regex] of Object.entries(categoryKeywords)) {
          if (regex.test(userMessage)) {
            relevantTransactions = relevantTransactions.filter(t => 
              (t.category || '').toLowerCase().includes(category) ||
              (t.description || '').toLowerCase().match(regex)
            );
            isYearOnlyQuery = false; // Not a pure year query if category specified
            break;
          }
        }
      }
      }
      
      // FALLBACK: If still no results and user said "show" or "list", show recent
      if (relevantTransactions.length === 0 && /show|list|all/i.test(userMessage)) {
        relevantTransactions = userTransactions.slice(0, 10);
      }
      
      // Build transaction context for AI
      if (relevantTransactions.length > 0) {
        const totalAmount = relevantTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
        
        transactionContext = `
TRANSACTION DATA FOUND:
- Count: ${relevantTransactions.length}
- Total Amount: ₹${totalAmount.toFixed(2)}
- Date Range: ${new Date(relevantTransactions[relevantTransactions.length - 1].date).toLocaleDateString('en-IN')} to ${new Date(relevantTransactions[0].date).toLocaleDateString('en-IN')}

Note: The transaction table will be shown separately to the user. Provide brief commentary only.
`;
      } else {
        transactionContext = `
NO TRANSACTIONS FOUND for this query.
Tell the user: "I couldn't find any transactions for this date/period. Please check if you have any transactions recorded, or try a different date."
`;
      }
    }
  const prompt = `
You are Creatzion AI — a friendly financial assistant for India. Your job is:
**CRITICAL: ALWAYS RESPOND IN ENGLISH ONLY. NEVER use Hindi, Tamil, Telugu, or any other language.**
1. **LANGUAGE**: Always reply in ENGLISH only, regardless of user's language.
2. Provide friendly financial advice focused on India: savings tips, salary management, gold price info.
3. **TRANSACTION QUERIES - ABSOLUTELY CRITICAL RULES**: 
   - When "TRANSACTION DATA FOUND" appears below, a REAL HTML TABLE is being shown to the user AUTOMATICALLY
   - The table shows: Date, Description, Amount, Category, Type, Recurring for each transaction
   - DO NOT create your own table in text format (no markdown tables, no ASCII tables, no | symbols)
   - DO NOT repeat transaction details - they're already in the HTML table
   - DO NOT say "as shown in the table above" and then create another table
   - Your job is ONLY to provide BRIEF commentary (2-3 sentences max)
   - Focus on: insights, patterns, advice based on the total amount and count shown
   - Example good response: "You spent ₹X across Y transactions in December. Consider reducing dining expenses."
   - Example BAD response: Creating a table with | Year | Month | Total | etc.
4. **SPENDING ANALYSIS**: If user's spending is unusually high, warn them and suggest ways to reduce expenses.
5. Provide emotional support if user feels sad, anxious, or stressed. Always say positive words like:
   - "You are not alone, I am here for you ❤️"
   - "It's okay to feel this way. Everything will be alright 🌈"
   - "Let's take a deep breath together 🌼"
6. Always show money amounts in Indian Rupees (₹).
7. If someone asks about gold price, you can say: "Gold price in India is approximately ₹6000 per gram" (just estimate).
8. Be very friendly, emotional, and supportive. Never be robotic.
9. Maintain conversation memory. Continue chatting from last conversation instead of restarting.
10. Don't add unnecessary greetings like "Namaste" unless the user says so.
${transactionContext}
Conversation History:
${conversationHistory.map((msg, idx) => `User${idx + 1}: ${msg}`).join("\n")}
Now, the latest message:
"${userMessage}"
**CRITICAL INSTRUCTIONS**: 
- RESPOND IN ENGLISH ONLY
- If "TRANSACTION DATA FOUND" appears above, a REAL HTML TABLE is shown separately
- DO NOT create any tables yourself (no markdown tables, no | symbols)
- Just give 2-3 sentences of helpful commentary about the spending
- DO NOT repeat the transaction data - it's in the HTML table already
- Example: "The table shows your December spending across all years. You spent ₹X total. Consider budgeting for festive seasons."
Reply in ENGLISH ONLY with BRIEF commentary. NO TABLES.
  `;
  try {
    // Use Mistral API instead of Gemini
    const mistralApiKey = process.env.MISTRAL_API_KEY;
    
    const mistralRes = await fetch(
      "https://api.mistral.ai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${mistralApiKey}`,
        },
        body: JSON.stringify({
          model: "mistral-large-latest", // Using Mistral's best model
          messages: [
            {
              role: "user",
              content: prompt.trim(),
            },
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      }
    );
    const mistralData = await mistralRes.json();
    const reply =
      mistralData?.choices?.[0]?.message?.content ??
      "😔 Sorry, I'm having trouble replying right now. Please try again later.";
    const clearFormattedReply = reply.replace(/\*/g, "").trim(); // Remove unwanted symbols like '*'
    // Prepare response with transaction data if available
    const response = { reply: clearFormattedReply };
    
    // If we have transaction data, send it separately for table rendering
    if (userId && userTransactions.length > 0 && relevantTransactions.length > 0) {
      // Use the isYearOnlyQuery flag set during filtering
      const yearMatch = userMessage.match(/\b(2024|2025|2026)\b/i);
      
      if (isYearOnlyQuery && yearMatch) {
        // Pure year query - send all transactions for monthly summary
        response.transactionData = {
          isYearSummary: true,
          year: parseInt(yearMatch[1]),
          transactions: relevantTransactions.map(t => ({
            date: t.date,
            description: t.description,
            amount: t.amount,
            category: t.category,
            type: t.type,
            isRecurring: t.isRecurring,
            recurringInterval: t.recurringInterval
          }))
        };
      } else {
        // Month/category/date query - send limited transactions for detail table
        response.transactionData = {
          isYearSummary: false,
          transactions: relevantTransactions.slice(0, 15).map(t => ({
            date: t.date,
            description: t.description,
            amount: t.amount,
            category: t.category,
            type: t.type,
            isRecurring: t.isRecurring,
            recurringInterval: t.recurringInterval
          })),
          total: relevantTransactions.reduce((sum, t) => sum + Number(t.amount), 0),
          count: relevantTransactions.length
        };
      }
    }
    return NextResponse.json(response);
  } catch (error) {
    console.error("Creatzion AI error:", error);
    return NextResponse.json(
      { error: "❌ Something went wrong while connecting to Creatzion AI." },
      { status: 500 }
    );
  }
}

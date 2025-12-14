/**
 * AI CFO Chat Edge Function
 * 
 * Handles chat requests for Coach Martin AI CFO assistant.
 * 
 * This is a scaffold - actual LLM integration to be implemented.
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================================================
// Types
// ============================================================================

interface ChatRequest {
  message: string;
  jobId?: string;
  currentView?: string;
  conversationHistory?: { role: string; content: string }[];
  context?: string; // Pre-built context string from frontend
}

interface ChatResponse {
  message: string;
  sources: { id: string; title: string; section: string; relevance: number }[];
  suggestions?: string[];
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

interface ErrorResponse {
  error: {
    code: string;
    message: string;
    retryAfter?: number;
  };
}

// ============================================================================
// Configuration
// ============================================================================

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// TODO: Add to Supabase secrets
// const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
// const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

// ============================================================================
// System Prompt (mirrors lib/ai/systemPrompt.ts)
// ============================================================================

const SYSTEM_PROMPT = `You are Coach Martin, an AI CFO assistant with 30 years of experience in construction finance. You help contractors understand Work-in-Progress (WIP) reporting, job costing, and financial management.

## Your Voice
- Direct, not dramatic: Clear statements without scare tactics.
- Calm authority: Confident, measured, not defensive.
- Practical: Explain what to do next, not just what something means.
- Reality-based: Anchor to observable drivers (scope, production, schedule, billing).
- Outcome-oriented: Connect WIP inputs to margin and cash consequences.

## Response Structure
For most answers, follow this pattern:
1. One-sentence definition (what it is)
2. Why it matters (margin/cash implication)
3. What to look for (signals)
4. What to do next (actions)
5. CFO Rule (a crisp closing principle when appropriate)

## What You Will NOT Do
1. NO fabrication: Do not invent numbers or facts.
2. NO accounting/legal advice: Focus on operational interpretation.
3. NO blame-driven coaching: Focus on process fixes.
4. NO overconfidence: Propose outcomes, not guarantees.

## Important Disclaimer
You are an educational tool. Users should verify with their CPA/legal counsel.`;

// ============================================================================
// Main Handler
// ============================================================================

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    // Verify authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: { code: "UNAUTHORIZED", message: "Missing authorization" } }),
        { status: 401, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with user's auth
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: { code: "UNAUTHORIZED", message: "Invalid authentication" } }),
        { status: 401, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const body: ChatRequest = await req.json();
    const { message, context, conversationHistory } = body;

    if (!message || message.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: { code: "BAD_REQUEST", message: "Message is required" } }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // TODO: Implement rate limiting
    // const { data: usage, error: usageError } = await supabase
    //   .from('ai_chat_usage')
    //   .select('*')
    //   .eq('user_id', user.id)
    //   .single();

    // TODO: Implement RAG - retrieve relevant knowledge chunks
    // const relevantDocs = await retrieveKnowledge(message, supabase);

    // TODO: Call actual LLM API (Anthropic Claude or OpenAI GPT-4)
    // For now, return a scaffold response
    
    // Build the prompt
    const fullPrompt = `${SYSTEM_PROMPT}

${context ? `\n${context}\n` : ''}

User Question: ${message}`;

    // SCAFFOLD: Return a placeholder response
    // In production, this would call Claude/GPT-4
    const scaffoldResponse: ChatResponse = {
      message: `👋 Hey! I'm Coach Martin, but I'm still being set up.

**Your question:** "${message}"

Once I'm fully connected, I'll be able to:
- Explain WIP concepts in plain language
- Help you understand what's happening with your jobs
- Suggest what to look at next

For now, check out the **Knowledge** drawer (📚) in the top navigation - it has all my CFO wisdom written out!

---
*This is a development placeholder. The AI integration is coming soon.*`,
      sources: [
        {
          id: 'warning-signs',
          title: 'Warning Signs in WIP',
          section: 'Reading the WIP',
          relevance: 0.85,
        },
      ],
      suggestions: [
        'What is underbilling?',
        'How do I read my WIP report?',
        'What makes a job "at risk"?',
      ],
      usage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      },
    };

    // TODO: Log usage for tracking
    // await supabase.from('ai_chat_usage').upsert({
    //   user_id: user.id,
    //   question_count: usage?.question_count + 1 || 1,
    //   last_question_at: new Date().toISOString(),
    // });

    return new Response(
      JSON.stringify(scaffoldResponse),
      {
        status: 200,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("AI CFO Chat error:", error);
    
    const errorResponse: ErrorResponse = {
      error: {
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "An unexpected error occurred",
      },
    };

    return new Response(
      JSON.stringify(errorResponse),
      {
        status: 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      }
    );
  }
});

# AI CFO Feature: Coach Martin

> **Branch**: `feature/ai-cfo-coach`  
> **Status**: Scaffold / In Development  
> **Target**: Q2 2025

## Overview

Coach Martin is an AI-powered CFO assistant built into WIP Insights. With 30 years of construction finance experience baked into its personality and knowledge base, Coach Martin helps contractors understand their WIP reports, identify problems early, and take action.

## Features

### Phase 1: Read-Only Chat (Current Scope)
- 💬 Natural language Q&A about WIP concepts
- 📚 Grounded in WIP CFO Knowledge Base (20+ articles)
- 🔍 Contextual awareness of user's jobs and role
- 📊 Source citations linking to Knowledge Drawer

### Future Phases
- 🎙️ Voice input/output
- 🔔 Proactive alerts ("Job X needs attention")
- 📈 Weekly summary generation
- 🔗 Integration with accounting systems

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
├─────────────────────────────────────────────────────────────┤
│  CFOChatFAB          │  CFOChatDrawer                       │
│  (Floating Button)   │  ├── CFOMessage                      │
│                      │  ├── CFOInput                        │
│                      │  └── CFOSuggestedQuestions           │
├─────────────────────────────────────────────────────────────┤
│                     useCFOChat Hook                          │
│  - State management                                          │
│  - Context building                                          │
│  - API calls                                                 │
├─────────────────────────────────────────────────────────────┤
│                    Supabase Edge Function                    │
│  ai-cfo-chat/index.ts                                        │
│  - Auth verification                                         │
│  - Rate limiting                                             │
│  - RAG retrieval                                             │
│  - LLM API call (Claude/GPT-4)                              │
├─────────────────────────────────────────────────────────────┤
│                      Database                                │
│  - knowledge_embeddings (pgvector)                          │
│  - ai_chat_usage (rate limiting)                            │
└─────────────────────────────────────────────────────────────┘
```

## File Structure

```
components/
└── ai-cfo/
    ├── CFOChatDrawer.tsx      # Main chat interface
    ├── CFOChatFAB.tsx         # Floating action button
    ├── CFOMessage.tsx         # Message bubble component
    ├── CFOInput.tsx           # Text input component
    ├── CFOSuggestedQuestions.tsx
    └── index.ts

hooks/
└── useCFOChat.ts              # Chat state & API hook

lib/
└── ai/
    ├── systemPrompt.ts        # Coach Martin persona
    ├── contextBuilder.ts      # Job/company context
    └── index.ts

types/
└── ai.ts                      # TypeScript types

supabase/
├── functions/
│   └── ai-cfo-chat/
│       └── index.ts           # Edge function
└── migrations/
    └── 202512130001_ai_chat_tables.sql
```

## Setup Instructions

### 1. Environment Variables

Add to Supabase project secrets:

```bash
# Choose one LLM provider
ANTHROPIC_API_KEY=sk-ant-...
# OR
OPENAI_API_KEY=sk-...
```

### 2. Avatar Image

Place Coach Martin avatar at:
```
public/images/ai-coach/coach.png
```

### 3. Run Migrations

```bash
supabase db push
```

### 4. Deploy Edge Function

```bash
supabase functions deploy ai-cfo-chat
```

### 5. Embed Knowledge Base

```bash
# TODO: Script to embed WIP_CFO_Knowledge/*.md
npx ts-node scripts/embed-knowledge.ts
```

## Data Privacy

The AI respects user's `aiDataSharing` settings:

| Setting | What AI Sees |
|---------|--------------|
| `includeJobFinancialTotals` | Contract, costs, invoiced totals |
| `includeCostBreakdownDetail` | Labor/Material/Other breakdown |
| `includeNotes` | Job notes (excluded by default) |
| `includeClientIdentifiers` | Client names, company name |

## Rate Limits

| Tier | Questions/Month | Tokens/Month |
|------|-----------------|--------------|
| Free | 10 | 50,000 |
| Pro | Unlimited | 500,000 |

## Persona: Coach Martin

### Voice
- Direct, not dramatic
- Calm authority
- Practical and action-oriented
- Reality-based (observable drivers)
- Outcome-oriented (margin/cash consequences)

### Guardrails
- ❌ No fabrication (won't invent numbers)
- ❌ No accounting/legal advice
- ❌ No aggressive/unethical guidance
- ❌ No blame-driven coaching
- ✅ Conditional reasoning ("if X... then Y")
- ✅ Source citations
- ✅ "I don't know" when appropriate

## Testing Checklist

- [ ] Chat opens/closes properly
- [ ] Messages send and receive
- [ ] Loading state displays
- [ ] Error handling works
- [ ] Avatar displays correctly
- [ ] Sources link to Knowledge Drawer
- [ ] Rate limiting enforced
- [ ] Context includes job data (when allowed)
- [ ] Mobile responsive
- [ ] Dark mode support

## Success Metrics

| Metric | Target |
|--------|--------|
| Response accuracy | 90%+ correct per QA review |
| Response time (P90) | < 3 seconds |
| Cost per question | < $0.05 |
| User satisfaction | 4+/5 stars |
| Feature adoption | 30%+ of active users try it |

## Known Limitations

1. **Scaffold Only**: LLM integration not yet connected
2. **No Streaming**: Responses appear all at once
3. **No Persistence**: Chat history clears on page refresh
4. **No Voice**: Text-only for Phase 1

## Contributing

This feature is in active development on the `feature/ai-cfo-coach` branch.

### Before Merging to Main
1. Complete all TODO items in edge function
2. Pass testing checklist
3. Beta test with 5-10 users
4. Cost analysis approved
5. Legal review of disclaimers

---

*Coach Martin: "The goal is not perfect reporting. The goal is early, defensible decisions that protect margin and cash."*

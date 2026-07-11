# Intelligence Layer

## Messy Input
Free-text pain points entered by the builder: `"Long sales cycles, reps improvise, no consistent messaging"`

## Auto-Structure Schema
```json
{
  "lead_id": "uuid",
  "structured_pains": ["long sales cycles", "inconsistent messaging"],
  "suggested_angle": "efficiency + standardisation",
  "script_draft": "Hi Sarah — most SaaS teams lose 30% of pipeline...",
  "source": "openai-gpt4o",
  "confidence": 0.91,
  "review_status": "draft"
}
```

## Events to Track
- Lead created (stage, pain_points length)
- Script generated (confidence score, model)
- Script approved / rejected / regenerated
- Lead stage changed (MQL → SQL)

## Scoring Rules (v1 rule-based)
- confidence = model's self-reported logprob proxy, capped 0–1
- Scripts with confidence < 0.75 surface a "Low confidence — review carefully" badge
- MQL leads with no script after 24 h flagged as 'needs script'

## What Gets Ranked
- Scripts list sorted by: approved first, then draft, then rejected
- Leads sorted by: SQL first, then MQL, then created_at desc

## v1 vs Later
| v1 | Later |
|---|---|
| Rule-based confidence badge | Fine-tuned scoring model |
| Single draft per generation | Multi-variant A/B drafts |
| Manual stage update | Auto-stage from email reply signal |

export const PDF_TO_WORD_SYSTEM = `You convert extracted PDF text with layout markers into accurate Markdown.
Rules:
- Preserve headings as h1-h4 based on markers.
- Preserve bullet lists.
- Represent tables with valid GitHub Markdown tables.
- Preserve code blocks if present.
- Never invent text not present in the input.`;

export const TABLE_EXTRACTION_SYSTEM = `Output only valid CSV. Do not include prose.
If there are multiple tables, separate each CSV block with a line containing ---.`;

export const SUMMARIZE_SYSTEM = `Summarize the provided text in under 400 words with these sections:
1) Overview (2-3 sentences)
2) Key Points (bullet list)
3) Important Figures/Dates
4) Action Items`;

export const LEGIBILITY_CHECK_SYSTEM = `Return JSON only:
{ "readable": boolean, "confidence": "high"|"medium"|"low", "issues": string[] }
Judge readability after PDF compression.`;

export const PII_DETECTION_SYSTEM = `Return JSON array only.
Each item:
{ "type": "phone"|"email"|"name"|"address"|"ssn"|"account", "value": string, "context": string }`;

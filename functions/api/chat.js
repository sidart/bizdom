// Binding refresh deploy v2
const SITE = "TheBizdom (thebizdom.in)";
const KNOWLEDGE_URL = "https://www.thebizdom.in/assets/js/bizdom-knowledge.json";

const SYSTEM_HEAD = `You are Bizdom Assistant, the AI guide of ${SITE} — a niche publication about Indian business history: the brands, business houses, markets, trades and people that shaped modern India.

Rules:
- Answer using ONLY the article knowledge provided below when it is relevant. Quote or paraphrase faithfully; do not invent facts, dates or names.
- If the knowledge does not contain the answer, say honestly that the archive doesn't cover it yet, and suggest a related article if one is close.
- Be warm, concise and story-driven: under 150 words unless the user asks for more.
- When you use an article, end with: "Read more: <url>".
- For greetings or questions about the site itself, answer briefly and invite the user to explore the archive.

ARTICLE KNOWLEDGE (most relevant first):
`;

const MODELS = [
  "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
  "@cf/meta/llama-3.1-8b-instruct",
];

// Stop-words excluded from retrieval scoring
const STOP = new Set(("the,a,an,and,or,but,of,in,on,at,to,for,with,by,from,as,is,was,are,were,be,been,it,its,this,that,these,those,you,your,i,we,they,he,she,his,her,their,what,which,who,whom,how,when,where,why,not,no,yes,do,did,does,can,could,would,should,about,into,over,under,after,before,between,through,during,also,very,some,any,all,more,most,other,such,only,own,same,so,than,then,there,here,us,our,them,him,me,my").split(","));

async function loadKnowledge() {
  // Cache in global scope so each isolate fetches the archive only once
  if (!globalThis.__bdKnowledge) {
    const res = await fetch(KNOWLEDGE_URL, { cf: { cacheTtl: 3600 } });
    if (!res.ok) throw new Error("knowledge fetch failed: " + res.status);
    globalThis.__bdKnowledge = await res.json();
  }
  return globalThis.__bdKnowledge;
}

function tokenize(s) {
  return (s.toLowerCase().match(/[a-z0-9]{3,}/g) || []).filter(w => !STOP.has(w));
}

function retrieve(knowledge, question, k = 2) {
  const qTokens = new Set(tokenize(question));
  if (qTokens.size === 0) return [];
  return knowledge
    .map(p => {
      const hay = (p.title + " " + p.tags.join(" ") + " " + p.text).toLowerCase();
      let score = 0;
      for (const t of qTokens) {
        if (hay.includes(t)) score += t.length; // longer matches matter more
      }
      // title/tag matches are stronger
      const titleHay = (p.title + " " + p.tags.join(" ")).toLowerCase();
      for (const t of qTokens) if (titleHay.includes(t)) score += 10;
      return { ...p, score };
    })
    .filter(p => p.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.AI) {
    return Response.json(
      { reply: "The assistant isn't configured yet (missing AI binding).", sources: [] },
      { status: 503 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const message = String(body.message || "").trim().slice(0, 1000);
  const history = Array.isArray(body.history) ? body.history.slice(-6) : [];
  if (!message) return Response.json({ error: "Empty message" }, { status: 400 });

  let knowledge;
  try {
    knowledge = await loadKnowledge();
  } catch (e) {
    return Response.json(
      { reply: "The archive index is still warming up — please try again in a minute.", sources: [] },
      { status: 503 }
    );
  }

  const matches = retrieve(knowledge, message);
  const knowledgeBlock = matches.length
    ? matches.map(p => `### ${p.title} (${p.date}) — https://www.thebizdom.in${p.url}\n${p.text}`).join("\n\n")
    : "(no article matched this question)";

  const messages = [
    { role: "system", content: SYSTEM_HEAD + knowledgeBlock },
    ...history.map(h => ({ role: h.role === "assistant" ? "assistant" : "user", content: String(h.content).slice(0, 2000) })),
    { role: "user", content: message },
  ];

  let reply = null;
  let lastErr = null;
  for (const model of MODELS) {
    try {
      const result = await env.AI.run(model, { messages });
      reply = result && (result.response || (result.result && result.result.response));
      if (reply) break;
    } catch (e) {
      lastErr = e;
    }
  }

  if (!reply) {
    return Response.json(
      { reply: "I'm having trouble thinking right now — please try again in a moment.", sources: [], debug: String(lastErr).slice(0, 200) },
      { status: 502 }
    );
  }

  return Response.json({
    reply,
    sources: matches.map(p => ({ title: p.title, url: "https://www.thebizdom.in" + p.url })),
  });
}

export async function onRequestGet() {
  return Response.json({ ok: true, site: SITE, knowledge: KNOWLEDGE_URL });
}

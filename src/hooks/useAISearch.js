import { useState, useRef, useCallback, useEffect } from "react";

/**
 * System prompt：要求模型只輸出可解析的電影推薦清單（JSON 為主，||| 為備援）。
 */
export const AI_MOVIE_RECOMMENDER_SYSTEM_PROMPT = `You are a movie recommendation engine for a TMDb-powered app.

Rules:
1. The user describes mood, genre, or constraints in any language.
2. Recommend 12 to 16 real, theatrically released movies that fit the description.
3. Prefer well-known English release titles (TMDb search works best with English titles). If the film is famous primarily under a non-English title, you may use that official title instead.
4. For each recommended movie, include a concise reason (1 short sentence) explaining why it matches the user's request.
5. Output ONLY machine-parseable content—no greetings, no explanations, no markdown fences.

Primary format (required): a single JSON object on one or more lines:
{"movies":[{"title":"Title One","year":2001,"reason":"Why this matches the user's request"},{"title":"Title Two","year":2010,"reason":"Why this matches the user's request"}]}
If the year is unknown, use year:null.

If JSON is absolutely impossible, use this exact fallback on one line only:
TITLE1|||TITLE2|||TITLE3|||TITLE4

Do not output anything else before or after that JSON or fallback line.`;

const AI_MAX_TITLES = 16;
const AI_TARGET_MOVIES = 20;
const TMDB_MAX_MATCHES_PER_TITLE = 2;
const TMDB_SEARCH_LANGUAGE = "en-US";
const AI_RETRY_ON_PARSE_FAILURE_ONCE = true;

function ollamaChatEndpoint() {
  const envBase = import.meta.env.VITE_OLLAMA_URL?.replace(/\/$/, "");
  if (envBase) return `${envBase}/api/chat`;
  if (import.meta.env.DEV) return "/ollama/api/chat";
  return "http://127.0.0.1:11434/api/chat";
}

function extractJsonObject(text) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  const slice = text.slice(start, end + 1);
  try {
    return JSON.parse(slice);
  } catch {
    return null;
  }
}

function parseYearMaybe(value) {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  if (!s) return null;
  // Keep only 4-digit year
  const m = s.match(/(\d{4})/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

function parseMovieSuggestionsFromResponse(fullText) {
  const raw = fullText.trim();
  if (!raw) return [];

  const unfenced = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const fromJson = extractJsonObject(unfenced) || extractJsonObject(raw);
  if (fromJson) {
    const moviesRaw =
      fromJson.movies ??
      fromJson.recommendations ??
      fromJson.titles ??
      fromJson.movie_titles ??
      null;

    // Format 1: movies: [{title, year}, ...]
    if (Array.isArray(moviesRaw)) {
      const normalized = moviesRaw
        .map((m) => {
          if (m && typeof m === "object") {
            const title = m.title ?? m.name ?? m.original_title ?? null;
            const reason = m.reason ?? m.why ?? m.match_reason ?? null;
            if (!title) return null;
            return {
              title: String(title).trim(),
              year: parseYearMaybe(m.year),
              reason: reason ? String(reason).trim() : null,
            };
          }

          // Format 2: titles: ["A", "B", ...]
          if (m !== null && m !== undefined) {
            const s = String(m).trim();
            if (!s) return null;
            // Attempt to parse "Title (1999)"
            const mm = s.match(/^(.*?)(?:\s*\((\d{4})\)\s*)?$/);
            return { title: (mm?.[1] ?? s).trim(), year: parseYearMaybe(mm?.[2]), reason: null };
          }

          return null;
        })
        .filter(Boolean);

      return normalized.slice(0, AI_MAX_TITLES);
    }

    // Allow a string fallback like "TITLE1|||TITLE2|||..."
    if (typeof moviesRaw === "string") {
      const viaPipes = moviesRaw.split("|||").map((s) => s.trim()).filter(Boolean);
      if (viaPipes.length >= 3) {
        return viaPipes
          .slice(0, AI_MAX_TITLES)
          .map((t) => {
            const mm = t.match(/^(.*?)(?:\s*\((\d{4})\)\s*)?$/);
            return {
              title: (mm?.[1] ?? t).trim(),
              year: parseYearMaybe(mm?.[2]),
              reason: null,
            };
          });
      }

      const viaLines = moviesRaw
        .split(/\n/)
        .map((s) => s.trim())
        .filter(Boolean);
      if (viaLines.length >= 3) {
        return viaLines
          .slice(0, AI_MAX_TITLES)
          .map((t) => {
            const mm = t.match(/^(.*?)(?:\s*\((\d{4})\)\s*)?$/);
          return {
            title: (mm?.[1] ?? t).trim(),
            year: parseYearMaybe(mm?.[2]),
            reason: null,
          };
          });
      }
    }
  }

  const lineWithPipes = unfenced.split(/\n/).find((l) => l.includes("|||"));
  if (lineWithPipes) {
    return lineWithPipes
      .split("|||")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, AI_MAX_TITLES)
      .map((t) => {
        const mm = t.match(/^(.*?)(?:\s*\((\d{4})\)\s*)?$/);
        return {
          title: (mm?.[1] ?? t).trim(),
          year: parseYearMaybe(mm?.[2]),
          reason: null,
        };
      });
  }

  const lines = unfenced
    .split(/\n/)
    .map((l) => l.replace(/^[-*•\d.)]+\s*/, "").trim())
    .filter(Boolean);
  if (lines.length >= 3) {
    return lines.slice(0, AI_MAX_TITLES).map((t) => {
      const mm = t.match(/^(.*?)(?:\s*\((\d{4})\)\s*)?$/);
      return {
        title: (mm?.[1] ?? t).trim(),
        year: parseYearMaybe(mm?.[2]),
        reason: null,
      };
    });
  }

  return [];
}

async function streamOllamaChat({ model, messages, onDelta, signal }) {
  const url = ollamaChatEndpoint();
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages, stream: true }),
    signal,
  });

  if (!res.ok) {
    const err = new Error(`Ollama HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let carry = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    carry += decoder.decode(value, { stream: true });
    const parts = carry.split("\n");
    carry = parts.pop() ?? "";

    for (const part of parts) {
      const line = part.trim();
      if (!line) continue;
      // Some Ollama versions may prefix each JSON line with "data: " (SSE-like).
      // Strip it so JSON.parse can succeed.
      const cleanedLine = line.replace(/^data:\s*/i, "");
      if (!cleanedLine || cleanedLine === "[DONE]") continue;
      let json;
      try {
        json = JSON.parse(cleanedLine);
      } catch {
        continue;
      }
      const piece =
        json?.message?.content ?? json?.response ?? json?.content ?? "";
      if (piece) onDelta(String(piece));
    }
  }

  if (carry.trim()) {
    try {
      const cleanedCarry = carry.trim().replace(/^data:\s*/i, "");
      const json = JSON.parse(cleanedCarry);
      const piece =
        json?.message?.content ?? json?.response ?? json?.content ?? "";
      if (piece) onDelta(String(piece));
    } catch {
      /* ignore trailing garbage */
    }
  }
}

function groqChatEndpoint() {
  return "https://api.groq.com/openai/v1/chat/completions";
}

async function streamGroqChat({ apiKey, model, messages, onDelta, signal }) {
  const url = groqChatEndpoint();
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages, stream: true }),
    signal,
  });

  if (!res.ok) {
    const err = new Error(`Groq HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let carry = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    carry += decoder.decode(value, { stream: true });
    const parts = carry.split("\n");
    carry = parts.pop() ?? "";

    for (const part of parts) {
      const line = part.trim();
      if (!line) continue;

      // Groq streaming uses SSE: each chunk starts with `data: { ... }`
      // Some servers may include prefix, and finish with `data: [DONE]`.
      const cleanedLine = line.replace(/^data:\s*/i, "");
      if (!cleanedLine || cleanedLine === "[DONE]") continue;

      let json;
      try {
        json = JSON.parse(cleanedLine);
      } catch {
        continue;
      }

      const piece =
        json?.choices?.[0]?.delta?.content ??
        json?.choices?.[0]?.delta?.text ??
        "";
      if (piece) onDelta(String(piece));
    }
  }

  if (carry.trim()) {
    try {
      const cleanedCarry = carry.trim().replace(/^data:\s*/i, "");
      const json = JSON.parse(cleanedCarry);
      const piece =
        json?.choices?.[0]?.delta?.content ??
        json?.choices?.[0]?.delta?.text ??
        "";
      if (piece) onDelta(String(piece));
    } catch {
      /* ignore trailing garbage */
    }
  }
}

async function fetchTmdbMatches({
  title,
  year,
  apiKey,
  baseUrl,
  signal,
  maxMatches,
}) {
  if (!apiKey || !title) return null;
  const url = `${baseUrl}/search/movie?api_key=${apiKey}&query=${encodeURIComponent(title)}&language=${TMDB_SEARCH_LANGUAGE}&include_adult=false&page=1`;
  const res = await fetch(url, { signal });
  if (!res.ok) return null;
  const data = await res.json();
  const results = data.results || [];
  if (year) {
    const wanted = Number(year);
    const withScore = results.map((m) => {
      const rd = m.release_date || "";
      const mYear = rd ? Number(rd.slice(0, 4)) : null;
      const score = mYear ? Math.abs(mYear - wanted) : 9999;
      return { m, score };
    });
    withScore.sort((a, b) => a.score - b.score);
    return withScore.map((x) => x.m).slice(0, maxMatches);
  }
  return results.slice(0, maxMatches);
}

async function fetchTmdbMovieDetails({
  movieId,
  apiKey,
  baseUrl,
  language,
  signal,
}) {
  if (!apiKey || !baseUrl || !movieId) return null;
  const url = `${baseUrl}/movie/${movieId}?api_key=${apiKey}&language=${encodeURIComponent(
    language || TMDB_SEARCH_LANGUAGE,
  )}`;

  const res = await fetch(url, { signal });
  if (!res.ok) return null;
  return await res.json();
}

const DEFAULT_OLLAMA_MODEL = import.meta.env.VITE_OLLAMA_MODEL || "llama3.2";
const DEFAULT_GROQ_MODEL =
  import.meta.env.VITE_GROQ_MODEL || "llama-3.3-70b-versatile";

/**
 * AI 智慧搜尋：串流推薦 → 解析片名 → TMDb 查詳細；失敗時由 onFallback 交回一般關鍵字搜尋。
 */
export function useAISearch({
  language,
  tmdbApiKey,
  tmdbBaseUrl,
  onSuccess,
  onFallback,
  provider = "ollama",
  ollamaModel = DEFAULT_OLLAMA_MODEL,
  groqApiKey,
  groqModel = DEFAULT_GROQ_MODEL,
}) {
  const [streamText, setStreamText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isResolvingMovies, setIsResolvingMovies] = useState(false);
  const [aiError, setAiError] = useState("");
  const [usedFallback, setUsedFallback] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [resolveProgress, setResolveProgress] = useState({ current: 0, total: 0 });
  const [resolvingTitle, setResolvingTitle] = useState("");

  const abortRef = useRef(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const runAISearch = useCallback(
    async (userPrompt) => {
      const prompt = userPrompt?.trim() ?? "";
      if (prompt.length < 4) return;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setStreamText("");
      setAiError("");
      setUsedFallback(false);
      setIsStreaming(true);
      setIsResolvingMovies(false);
      setAiSuggestions([]);
      setResolveProgress({ current: 0, total: 0 });
      setResolvingTitle("");

      let accumulated = "";
      const modelUsed = provider === "groq" ? groqModel : ollamaModel;
      const cacheKey = `cineShelf_ai_suggestions:${provider}:${modelUsed}:${prompt}`;
      let cachedSuggestions = [];
      try {
        if (typeof sessionStorage !== "undefined") {
          const raw = sessionStorage.getItem(cacheKey);
          if (raw) cachedSuggestions = JSON.parse(raw);
        }
      } catch {
        /* ignore cache errors */
      }

      let parsedSuggestions = Array.isArray(cachedSuggestions) ? cachedSuggestions : [];
      let didRetryParse = false;

      const failToKeyword = (reason) => {
        if (controller.signal.aborted) return;
        setAiError(reason);
        setUsedFallback(true);
        setIsStreaming(false);
        setIsResolvingMovies(false);
        onFallback?.(prompt);
      };

      const runAiOnce = async ({ repairMode }) => {
        let localAccumulated = "";
        const messages = [
          {
            role: "system",
            content: repairMode
              ? `${AI_MOVIE_RECOMMENDER_SYSTEM_PROMPT}\n\nCRITICAL: Your output MUST be valid JSON only. Do not include markdown fences.`
              : AI_MOVIE_RECOMMENDER_SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: repairMode
              ? `你先前的輸出無法解析。請只輸出符合格式的 JSON（movies 只包含 title 與 year，年未知用 year:null）。原始需求：${prompt}`
              : prompt,
          },
        ];

        if (provider === "groq") {
          if (!groqApiKey) throw new Error("Groq API key missing");
          await streamGroqChat({
            apiKey: groqApiKey,
            model: groqModel,
            messages,
            signal: controller.signal,
            onDelta: (chunk) => {
              localAccumulated += chunk;
              setStreamText((prev) => prev + chunk);
            },
          });
        } else {
          await streamOllamaChat({
            model: ollamaModel,
            messages,
            signal: controller.signal,
            onDelta: (chunk) => {
              localAccumulated += chunk;
              setStreamText((prev) => prev + chunk);
            },
          });
        }
        return localAccumulated;
      };

      if (parsedSuggestions.length === 0) {
        try {
          accumulated = await runAiOnce({ repairMode: false });
        } catch (e) {
          if (e.name === "AbortError") return;
          failToKeyword(
            e.message || (provider === "groq" ? "Groq unavailable" : "Ollama unavailable"),
          );
          return;
        } finally {
          setIsStreaming(false);
        }

        parsedSuggestions = parseMovieSuggestionsFromResponse(accumulated);
        if (
          parsedSuggestions.length === 0 &&
          AI_RETRY_ON_PARSE_FAILURE_ONCE &&
          !didRetryParse
        ) {
          didRetryParse = true;
          // Retry: reset stream UI so user sees the second attempt clearly.
          setStreamText("");
          setIsStreaming(true);
          try {
            accumulated = await runAiOnce({ repairMode: true });
          } catch (e) {
            if (e.name === "AbortError") return;
            failToKeyword(
              e.message || (provider === "groq" ? "Groq unavailable" : "Ollama unavailable"),
            );
            return;
          } finally {
            setIsStreaming(false);
          }
          parsedSuggestions = parseMovieSuggestionsFromResponse(accumulated);
        }
      } else {
        // Cache hit: we can skip AI streaming completely.
        setIsStreaming(false);
      }

      if (parsedSuggestions.length === 0) {
        failToKeyword("Could not parse movie suggestions from AI response");
        return;
      }

      try {
        if (typeof sessionStorage !== "undefined") {
          sessionStorage.setItem(cacheKey, JSON.stringify(parsedSuggestions));
        }
      } catch {
        /* ignore cache errors */
      }

      setAiSuggestions(parsedSuggestions);
      setResolveProgress({ current: 0, total: parsedSuggestions.length });

      setIsResolvingMovies(true);

      try {
        const seen = new Set();
        const movies = [];

        // Sequential fetching to keep TMDb load reasonable
        for (let i = 0; i < parsedSuggestions.length; i += 1) {
          const s = parsedSuggestions[i];
          if (!s?.title) continue;

          setResolvingTitle(s.title);
          setResolveProgress({ current: i, total: parsedSuggestions.length });

          const matches = await fetchTmdbMatches({
            title: s.title,
            year: s.year,
            apiKey: tmdbApiKey,
            baseUrl: tmdbBaseUrl,
            signal: controller.signal,
            maxMatches: TMDB_MAX_MATCHES_PER_TITLE,
          });

          if (Array.isArray(matches)) {
            for (const m of matches) {
              if (m && !seen.has(m.id)) {
                seen.add(m.id);
                // Ensure UI language title/overview (e.g. zh-TW) rather than only search-language fields.
                const details = await fetchTmdbMovieDetails({
                  movieId: m.id,
                  apiKey: tmdbApiKey,
                  baseUrl: tmdbBaseUrl,
                  language,
                  signal: controller.signal,
                });

                movies.push(details || m);
                if (movies.length >= AI_TARGET_MOVIES) break;
              }
            }
          }

          if (movies.length >= AI_TARGET_MOVIES) break;
        }

        if (movies.length === 0) {
          failToKeyword("No TMDb matches for recommended titles");
          return;
        }

        onSuccess?.(movies, prompt);
      } catch (e) {
        if (e.name === "AbortError") return;
        failToKeyword(e.message || "TMDb lookup failed");
        return;
      } finally {
        setIsResolvingMovies(false);
        setResolvingTitle("");
      }
    },
    [language, provider, ollamaModel, groqApiKey, groqModel, onFallback, onSuccess, tmdbApiKey, tmdbBaseUrl],
  );

  const currentModel = provider === "groq" ? groqModel : ollamaModel;

  const resetAIUi = useCallback(() => {
    abortRef.current?.abort();
    setStreamText("");
    setIsStreaming(false);
    setIsResolvingMovies(false);
    setAiError("");
    setUsedFallback(false);
    setAiSuggestions([]);
    setResolveProgress({ current: 0, total: 0 });
    setResolvingTitle("");
  }, []);

  const aiBusy = isStreaming || isResolvingMovies;

  return {
    streamText,
    isStreaming,
    isResolvingMovies,
    aiBusy,
    aiError,
    usedFallback,
    aiSuggestions,
    resolveProgress,
    resolvingTitle,
    runAISearch,
    resetAIUi,
    model: currentModel,
  };
}

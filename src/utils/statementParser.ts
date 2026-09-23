/**
 * Utility to detect and extract structured statements/segments from question stems.
 * Specifically targets sequenced statement questions:
 * - Sequential letters: "K. these are the structural rules L. to live M. that the committee N. by O. expects us"
 * - Parenthesized statements: "(J) 'लोटा' देशज शब्द है। (K) 'खिड़की' देशज शब्द है। (L) 'चाय' मूलतः चीनी..."
 * - Numbered statements: "1. First statement 2. Second statement 3. Third statement"
 * - Roman numerals: "I. First statement II. Second statement III. Third statement"
 * - Explicit labels: "Statement 1: ... Statement 2: ..." or "कथन (J): ... कथन (K): ..."
 *
 * NOTE: Strict guards are enforced to NEVER treat Assertion-Reason or sentence-error spotting
 * as statement segments.
 */

export interface ExtractedSegment {
  id: string; // e.g. "K", "L", "1", "I", "J"
  label: string; // e.g. "K", "L", "1", "I", "J"
  text: string;
}

export interface ParsedStemSegments {
  hasSegments: boolean;
  intro: string;
  segments: ExtractedSegment[];
}

export function extractStatementsFromStem(text: string): ParsedStemSegments {
  if (!text || typeof text !== 'string') {
    return { hasSegments: false, intro: '', segments: [] };
  }

  const cleanText = text.trim();

  // -------------------------------------------------------------
  // GUARD 1: Assertion-Reason Detection
  // Assertion-Reason questions have a distinct structure (Assertion (A) and Reason (R))
  // and MUST NEVER be parsed into generic multi-statement cards.
  // -------------------------------------------------------------
  const isAssertionReason = (
    /\b(?:assertion|reason|अभिकथन|कारण)\b/i.test(cleanText) ||
    /\b(?:labelled\s+as\s+assertion|one\s+is\s+labelled)\b/i.test(cleanText) ||
    /(?:\[A\]|\(A\)).*?(?:\[R\]|\(R\))/i.test(cleanText) ||
    /(?:अभिकथन\s*[\(\[]A[\)\]]|कारण\s*[\(\[]R[\)\]])/i.test(cleanText)
  );

  if (isAssertionReason) {
    return { hasSegments: false, intro: cleanText, segments: [] };
  }

  // -------------------------------------------------------------
  // GUARD 2: Matching / List question detection
  // Matching questions use List-I / List-II or Column A / Column B
  // -------------------------------------------------------------
  const isMatching = (
    /\b(?:match\s+the\s+following|सुमेलित\s+कीजिए|list-i|list\s+i|सूची-i|सूची\s+i)\b/i.test(cleanText)
  );

  if (isMatching) {
    return { hasSegments: false, intro: cleanText, segments: [] };
  }

  // Helper to slice segments from matched markers
  const buildResult = (matches: { label: string; index: number; length: number }[]): ParsedStemSegments => {
    const intro = cleanText.slice(0, matches[0].index).trim();
    const segments: ExtractedSegment[] = [];

    for (let i = 0; i < matches.length; i++) {
      const curr = matches[i];
      const textStart = curr.index + curr.length;
      const textEnd = i < matches.length - 1 ? matches[i + 1].index : cleanText.length;
      const segText = cleanText.slice(textStart, textEnd).trim();
      if (segText) {
        segments.push({
          id: curr.label,
          label: curr.label,
          text: segText,
        });
      }
    }

    if (segments.length >= 2) {
      return {
        hasSegments: true,
        intro,
        segments,
      };
    }
    return { hasSegments: false, intro: cleanText, segments: [] };
  };

  // -------------------------------------------------------------
  // Pattern 1: Capital letters with period (e.g. K. these... L. to live... M. that...)
  // Labels must be strictly sequential (e.g. K, L, M, N, O or J, K, L, M or P, Q, R, S)
  // -------------------------------------------------------------
  const letterDotRegex = /(?:[:\s\n]|^)([A-Z])\.\s+/g;
  let matches: { label: string; index: number; length: number }[] = [];
  let m: RegExpExecArray | null;

  while ((m = letterDotRegex.exec(cleanText)) !== null) {
    const fullMatch = m[0];
    const label = m[1];
    const offset = fullMatch.indexOf(label + '.');
    matches.push({
      label,
      index: m.index + offset,
      length: fullMatch.length - offset,
    });
  }

  if (matches.length >= 2) {
    const labels = matches.map(item => item.label);
    const unique = new Set(labels);
    if (unique.size === labels.length) {
      // Must be strictly sequential uppercase letters (e.g. K, L, M, N, O or J, K, L, M)
      const isSequential = labels.every((l, i) => {
        if (i === 0) return true;
        const prevCode = labels[i - 1].charCodeAt(0);
        const currCode = l.charCodeAt(0);
        return currCode === prevCode + 1;
      });

      if (isSequential) {
        const res = buildResult(matches);
        if (res.hasSegments) return res;
      }
    }
  }

  // -------------------------------------------------------------
  // Pattern 2: Parentheses delimiters: (J) ... (K) ... or (1) ... (2) ... or (i) ... (ii) ...
  // Labels must be strictly sequential: (J), (K), (L) or (1), (2), (3) or (i), (ii), (iii)
  // NEVER (A) and (R)!
  // -------------------------------------------------------------
  const parenRegex = /(?:[:\s\n]|^)\(([A-Za-z0-9IVXLCDMivxlcdm]+)\)\s*/g;
  matches = [];
  while ((m = parenRegex.exec(cleanText)) !== null) {
    const fullMatch = m[0];
    const label = m[1];
    const offset = fullMatch.indexOf('(' + label + ')');
    matches.push({
      label,
      index: m.index + offset,
      length: fullMatch.length - offset,
    });
  }

  if (matches.length >= 2) {
    const rawLabels = matches.map(item => item.label);
    // 2a. Sequential letters check (e.g. J, K, L, M or P, Q, R, S)
    if (/^[A-Za-z]$/.test(rawLabels[0])) {
      const upper = rawLabels.map(l => l.toUpperCase());
      const isSequentialLetters = upper.every((l, i) => {
        if (i === 0) return true;
        return l.charCodeAt(0) === upper[i - 1].charCodeAt(0) + 1;
      });
      if (isSequentialLetters) {
        const res = buildResult(matches);
        if (res.hasSegments) return res;
      }
    }

    // 2b. Sequential numbers check (e.g. 1, 2, 3)
    if (/^[0-9]+$/.test(rawLabels[0])) {
      const nums = rawLabels.map(l => parseInt(l, 10));
      const isSequentialNums = nums.every((n, i) => i === 0 || n === nums[i - 1] + 1);
      if (isSequentialNums) {
        const res = buildResult(matches);
        if (res.hasSegments) return res;
      }
    }

    // 2c. Sequential Roman numerals check
    const romanOrder = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x'];
    const lower = rawLabels.map(l => l.toLowerCase());
    if (romanOrder.includes(lower[0])) {
      const isSequentialRoman = lower.every((r, i) => {
        if (i === 0) return true;
        const prevIdx = romanOrder.indexOf(lower[i - 1]);
        const currIdx = romanOrder.indexOf(r);
        return prevIdx !== -1 && currIdx === prevIdx + 1;
      });
      if (isSequentialRoman) {
        const res = buildResult(matches);
        if (res.hasSegments) return res;
      }
    }
  }

  // -------------------------------------------------------------
  // Pattern 3: Numbered statements with period: 1. ... 2. ... 3. ...
  // -------------------------------------------------------------
  const numRegex = /(?:[:\s\n]|^)([0-9]+)\.\s+/g;
  matches = [];
  while ((m = numRegex.exec(cleanText)) !== null) {
    const fullMatch = m[0];
    const label = m[1];
    const offset = fullMatch.indexOf(label + '.');
    matches.push({
      label,
      index: m.index + offset,
      length: fullMatch.length - offset,
    });
  }

  if (matches.length >= 2) {
    const nums = matches.map(item => parseInt(item.label, 10));
    const isSequential = nums.every((n, i) => i === 0 || n === nums[i - 1] + 1);
    if (isSequential) {
      const res = buildResult(matches);
      if (res.hasSegments) return res;
    }
  }

  // -------------------------------------------------------------
  // Pattern 4: Statement / कथन prefix: Statement 1 ... Statement 2 ...
  // -------------------------------------------------------------
  const stmtRegex = /(?:[:\s\n]|^)(?:Statement|कथन)\s+([0-9A-Za-zIVXLCDMivxlcdm]+)[:.-]?\s*/gi;
  matches = [];
  while ((m = stmtRegex.exec(cleanText)) !== null) {
    const fullMatch = m[0];
    const label = m[1];
    matches.push({
      label,
      index: m.index,
      length: fullMatch.length,
    });
  }

  if (matches.length >= 2) {
    const res = buildResult(matches);
    if (res.hasSegments) return res;
  }

  // -------------------------------------------------------------
  // Pattern 5: Multi-line formatted lines strictly starting with statement marker
  // -------------------------------------------------------------
  const lines = cleanText.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length >= 3) {
    const candidateLines: { label: string; text: string }[] = [];
    const promptLines: string[] = [];

    lines.forEach(line => {
      const mLine = line.match(/^(\([J-Z0-9ivx]+\)|[J-Z]\.|\b[1-9]\.)\s*(.*)$/i);
      if (mLine) {
        const rawLabel = mLine[1].replace(/[().]/g, '').trim();
        candidateLines.push({
          label: rawLabel,
          text: mLine[2].trim(),
        });
      } else {
        if (candidateLines.length === 0) {
          promptLines.push(line);
        }
      }
    });

    if (candidateLines.length >= 2) {
      return {
        hasSegments: true,
        intro: promptLines.join(' '),
        segments: candidateLines.map(c => ({ id: c.label, label: c.label, text: c.text })),
      };
    }
  }

  return { hasSegments: false, intro: cleanText, segments: [] };
}

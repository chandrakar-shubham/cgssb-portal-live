import React from 'react';

/**
 * Utility to render LaTeX / Math notation cleanly in React without crashing on complex inputs.
 * Replaces common LaTeX commands (\frac, \sqrt, \times, \pm, \pi, etc.) and handles superscripts and subscripts.
 */
export function formatMathString(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/\\times/g, ' × ')
    .replace(/\\div/g, ' ÷ ')
    .replace(/\\pm/g, ' ± ')
    .replace(/\\le/g, ' ≤ ')
    .replace(/\\ge/g, ' ≥ ')
    .replace(/\\neq/g, ' ≠ ')
    .replace(/\\approx/g, ' ≈ ')
    .replace(/\\infty/g, ' ∞ ')
    .replace(/\\pi/g, 'π')
    .replace(/\\theta/g, 'θ')
    .replace(/\\alpha/g, 'α')
    .replace(/\\beta/g, 'β')
    .replace(/\\gamma/g, 'γ')
    .replace(/\\Delta/g, 'Δ')
    .replace(/\\lambda/g, 'λ')
    .replace(/\\mu/g, 'μ')
    .replace(/\\sigma/g, 'σ')
    .replace(/\\degree/g, '°')
    .replace(/\\circ/g, '°')
    .replace(/\\cdot/g, ' · ')
    .replace(/\\rightarrow/g, ' → ')
    .replace(/\\leftarrow/g, ' ← ')
    .replace(/\\sum/g, '∑')
    .replace(/\\int/g, '∫')
    .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
    .replace(/\\sqrt(\d+)/g, '√$1')
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1 / $2)');
}

/**
 * FormattedMathText component:
 * Parses text containing inline LaTeX `$formula$` or block `$$formula$$` or standard text,
 * rendering math tokens with custom styling (monospace/serif, font-feature-settings)
 * and properly formatted exponents/indices.
 */
export const FormattedMathText: React.FC<{ text: string; className?: string }> = ({ text, className = '' }) => {
  if (!text) return null;

  // Split by inline or display math delimiters: $...$ or $$...$$
  const mathRegex = /(\$\$[\s\S]*?\$\$|\$[^\$]+?\$)/g;
  const parts = text.split(mathRegex);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (!part) return null;

        // Display math ($$...$$)
        if (part.startsWith('$$') && part.endsWith('$$')) {
          const content = formatMathString(part.slice(2, -2).trim());
          return (
            <span
              key={index}
              className="block my-2 py-1.5 px-3 rounded-lg bg-slate-950/70 border border-slate-800 text-center font-mono text-emerald-300 text-sm sm:text-base tracking-wide overflow-x-auto"
            >
              {renderMathSegments(content)}
            </span>
          );
        }

        // Inline math ($...$)
        if (part.startsWith('$') && part.endsWith('$')) {
          const content = formatMathString(part.slice(1, -1).trim());
          return (
            <span
              key={index}
              className="inline-block mx-0.5 px-1 py-0.5 rounded bg-slate-800/80 font-mono text-emerald-300 text-xs sm:text-sm tracking-wide border border-slate-700/60"
            >
              {renderMathSegments(content)}
            </span>
          );
        }

        // Standard text: also support basic superscripts ^2 and subscripts _n
        return <span key={index}>{renderSuperSubscripts(formatMathString(part))}</span>;
      })}
    </span>
  );
};

function renderMathSegments(str: string): React.ReactNode {
  return renderSuperSubscripts(str);
}

function renderSuperSubscripts(str: string): React.ReactNode[] {
  // Regex to detect ^(...) or ^\w+ and _(...) or _\w+
  const tokenRegex = /(\^\{[^}]+\}|\^[0-9a-zA-Z+-]+|_\{[^}]+\}|_[0-9a-zA-Z+-]+)/g;
  const tokens = str.split(tokenRegex);

  return tokens.map((token, i) => {
    if (!token) return null;

    if (token.startsWith('^')) {
      const supContent = token.startsWith('^{') ? token.slice(2, -1) : token.slice(1);
      return (
        <sup key={i} className="text-[0.75em] font-bold text-amber-300">
          {supContent}
        </sup>
      );
    }

    if (token.startsWith('_')) {
      const subContent = token.startsWith('_{') ? token.slice(2, -1) : token.slice(1);
      return (
        <sub key={i} className="text-[0.75em] font-semibold text-sky-300">
          {subContent}
        </sub>
      );
    }

    return token;
  });
}

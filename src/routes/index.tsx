import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  Copy,
  Download,
  Eye,
  EyeOff,
  Lightbulb,
  Loader2,
  RefreshCw,
  Shield,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { analyzePassword, type Analysis, type Strength } from "@/lib/password-strength";
import { generatePassword, type GeneratorOptions } from "@/lib/password-generator";
import { downloadSecurityReport } from "@/lib/security-report";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Password Strength Analyzer — Entropy, Score & Generator" },
      {
        name: "description",
        content:
          "Analyze password strength with entropy in bits, estimated crack time, pattern detection and a secure password generator. Export a PDF security report.",
      },
      {
        property: "og:title",
        content: "Password Strength Analyzer — Entropy, Score & Generator",
      },
      {
        property: "og:description",
        content:
          "Score passwords out of 100 with entropy, crack-time estimates, weak-pattern detection and a cryptographically secure generator.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

/** Meter colours: red -> orange -> yellow -> green. */
const STRENGTH_STYLES: Record<Strength, { text: string; bar: string; ring: string }> = {
  Weak: { text: "text-destructive", bar: "bg-destructive", ring: "bg-destructive/15" },
  Medium: { text: "text-warning", bar: "bg-warning", ring: "bg-warning/15" },
  Good: { text: "text-caution", bar: "bg-caution", ring: "bg-caution/15" },
  Strong: { text: "text-primary", bar: "bg-primary", ring: "bg-primary/15" },
};

const DEFAULT_OPTIONS: GeneratorOptions = {
  length: 16,
  uppercase: true,
  lowercase: true,
  numbers: true,
  symbols: true,
};

const TOGGLE_LABELS: { key: keyof Omit<GeneratorOptions, "length">; label: string }[] = [
  { key: "uppercase", label: "A-Z" },
  { key: "lowercase", label: "a-z" },
  { key: "numbers", label: "0-9" },
  { key: "symbols", label: "!@#" },
];

function Index() {
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [result, setResult] = useState<Analysis | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [options, setOptions] = useState<GeneratorOptions>(DEFAULT_OPTIONS);

  const tone = useMemo(() => (result ? STRENGTH_STYLES[result.strength] : null), [result]);

  const handleAnalyze = useCallback(
    (value: string = password) => {
      if (!value) {
        setError("Please enter a password to analyze.");
        setResult(null);
        return;
      }
      setError("");
      setLoading(true);
      // Brief delay so the loading micro-interaction is perceivable.
      window.setTimeout(() => {
        setResult(analyzePassword(value));
        setLoading(false);
      }, 320);
    },
    [password],
  );

  const handleGenerate = useCallback(() => {
    try {
      const generated = generatePassword(options);
      setPassword(generated);
      setVisible(true);
      setError("");
      setResult(analyzePassword(generated));
      toast.success("Strong password generated");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not generate a password.";
      setError(message);
      toast.error(message);
    }
  }, [options]);

  const handleCopy = useCallback(async () => {
    if (!password) {
      toast.error("Nothing to copy yet.");
      return;
    }
    try {
      await navigator.clipboard.writeText(password);
      toast.success("Password copied to clipboard");
    } catch {
      toast.error("Clipboard access was blocked by your browser.");
    }
  }, [password]);

  const handleExport = useCallback(() => {
    if (!result) return;
    downloadSecurityReport(result);
    toast.success("Security report downloaded");
  }, [result]);

  const toggleOption = (key: keyof Omit<GeneratorOptions, "length">) =>
    setOptions((previous) => ({ ...previous, [key]: !previous[key] }));

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <section className="animate-rise w-full max-w-xl rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] sm:p-9">
        <header>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight sm:text-3xl">
            <img
              src={logoAsset.url}
              alt="Password Strength Analyzer logo"
              className="size-9 rounded-lg"
            />
            Password Strength Analyzer
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Entropy-based scoring, weak-pattern detection and crack-time estimates. Everything
            runs locally — your password never leaves this device.
          </p>
        </header>

        {/* ---------- Input ---------- */}
        <div className="mt-7 flex gap-2">
          <div className="relative flex-1">
            <label htmlFor="password" className="sr-only">
              Password to analyze
            </label>
            <input
              id="password"
              type={visible ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
              placeholder="Enter your password"
              autoComplete="new-password"
              spellCheck={false}
              aria-describedby="password-help"
              className="w-full rounded-xl border border-border bg-input py-3 pl-4 pr-20 text-base outline-none transition-all placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25"
            />
            <div className="absolute inset-y-0 right-2 flex items-center gap-0.5">
              <button
                type="button"
                onClick={handleCopy}
                aria-label="Copy password to clipboard"
                className="grid size-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <Copy className="size-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setVisible((v) => !v)}
                aria-label={visible ? "Hide password" : "Show password"}
                aria-pressed={visible}
                className="grid size-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                {visible ? (
                  <EyeOff className="size-4" aria-hidden="true" />
                ) : (
                  <Eye className="size-4" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>
        <p id="password-help" className="sr-only">
          Press Enter or use the Analyze Password button to score your password.
        </p>

        <button
          type="button"
          onClick={() => handleAnalyze()}
          disabled={loading}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[image:var(--gradient-primary)] py-3.5 text-base font-semibold text-primary-foreground transition-all hover:-translate-y-0.5 hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Analyzing…
            </>
          ) : (
            "Analyze Password"
          )}
        </button>

        {/* ---------- Generator ---------- */}
        <button
          type="button"
          onClick={() => setShowGenerator((s) => !s)}
          aria-expanded={showGenerator}
          aria-controls="generator-panel"
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface py-3 text-sm font-medium text-foreground transition-all hover:border-ring hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <RefreshCw className="size-4 text-primary" aria-hidden="true" />
          Generate Strong Password
        </button>

        {showGenerator ? (
          <div
            id="generator-panel"
            className="animate-rise mt-3 rounded-xl border border-border bg-surface p-4"
          >
            <div className="flex items-center justify-between">
              <label htmlFor="length" className="text-sm font-medium">
                Length
              </label>
              <span className="text-sm tabular-nums text-muted-foreground">{options.length}</span>
            </div>
            <input
              id="length"
              type="range"
              min={8}
              max={32}
              value={options.length}
              onChange={(e) => setOptions((p) => ({ ...p, length: Number(e.target.value) }))}
              aria-valuemin={8}
              aria-valuemax={32}
              aria-valuenow={options.length}
              className="mt-2.5 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-secondary accent-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
            />

            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {TOGGLE_LABELS.map(({ key, label }) => {
                const active = options[key];
                return (
                  <button
                    key={key}
                    type="button"
                    role="switch"
                    aria-checked={active}
                    aria-label={`Include ${key}`}
                    onClick={() => toggleOption(key)}
                    className={`rounded-lg border py-2 text-sm font-medium transition-all hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                      active
                        ? "border-primary/50 bg-primary/15 text-primary"
                        : "border-border bg-card text-muted-foreground"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={handleGenerate}
                className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                Generate
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:border-ring hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <Copy className="size-4" aria-hidden="true" />
                Copy
              </button>
            </div>
          </div>
        ) : null}

        {error ? (
          <p role="alert" className="animate-rise mt-4 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        {/* ---------- Results ---------- */}
        <div aria-live="polite">
          {result && tone ? (
            <div className="animate-rise mt-7">
              <div className="flex items-baseline justify-between">
                <span className={`text-lg font-bold transition-colors ${tone.text}`}>
                  {result.strength}
                </span>
                <span className="text-sm tabular-nums text-muted-foreground">
                  {result.score} / 100
                </span>
              </div>

              <div
                className="mt-2 h-2.5 overflow-hidden rounded-full bg-surface"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={result.score}
                aria-label={`Password score: ${result.score} out of 100, ${result.strength}`}
              >
                <div
                  className={`h-full rounded-full transition-[width,background-color] duration-700 ease-out ${tone.bar}`}
                  style={{ width: `${result.score}%` }}
                />
              </div>

              {/* Entropy + crack time */}
              <dl className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-border bg-surface p-3">
                  <dt className="text-xs uppercase tracking-widest text-muted-foreground">
                    Entropy
                  </dt>
                  <dd className="mt-1 text-base font-semibold tabular-nums">
                    {result.entropy} bits
                  </dd>
                  <dd className="text-xs text-muted-foreground">{result.entropyLabel}</dd>
                </div>
                <div className="rounded-xl border border-border bg-surface p-3">
                  <dt className="text-xs uppercase tracking-widest text-muted-foreground">
                    Est. crack time
                  </dt>
                  <dd className="mt-1 text-base font-semibold">{result.crackTime}</dd>
                  <dd className="text-xs text-muted-foreground">offline GPU attack</dd>
                </div>
              </dl>

              {/* Checklist */}
              <ul className="mt-5 grid gap-2.5">
                {result.checks.map((check) => (
                  <li
                    key={check.key}
                    className={`flex items-center gap-3 text-sm transition-colors ${
                      check.passed ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    <span
                      className={`grid size-5.5 flex-none place-items-center rounded-full ${
                        check.passed
                          ? "bg-primary/15 text-primary"
                          : "bg-destructive/15 text-destructive"
                      }`}
                      aria-hidden="true"
                    >
                      {check.passed ? <Check className="size-3" /> : <X className="size-3" />}
                    </span>
                    <span>
                      <span className="sr-only">{check.passed ? "Passed: " : "Failed: "}</span>
                      {check.label}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Warnings */}
              {result.warnings.length ? (
                <div className="mt-5 rounded-xl border border-destructive/40 bg-destructive/10 p-4">
                  <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-destructive">
                    <AlertTriangle className="size-3.5" aria-hidden="true" />
                    Detected weaknesses
                  </h2>
                  <ul className="mt-2.5 grid list-disc gap-1.5 pl-5 text-sm">
                    {result.warnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {/* Suggestions */}
              <div className="mt-4 rounded-xl border border-border bg-surface p-4">
                <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  <Lightbulb className="size-3.5" aria-hidden="true" />
                  Suggestions
                </h2>
                <ul className="mt-2.5 grid list-disc gap-1.5 pl-5 text-sm">
                  {result.suggestions.map((tip) => (
                    <li key={tip}>{tip}</li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                onClick={handleExport}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface py-3 text-sm font-medium transition-all hover:-translate-y-0.5 hover:border-ring hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <Download className="size-4 text-primary" aria-hidden="true" />
                Download Security Report
              </button>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}

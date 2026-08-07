import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { analyzePassword, type Analysis } from "@/lib/password-strength";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Password Strength Analyzer — Score Your Password" },
      {
        name: "description",
        content:
          "Check password strength instantly: get a score out of 100, a Weak/Medium/Strong rating, a security checklist and tips to improve it.",
      },
      { property: "og:title", content: "Password Strength Analyzer — Score Your Password" },
      {
        property: "og:description",
        content:
          "Instant password scoring out of 100 with a strength meter, security checklist and improvement suggestions.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const STRENGTH_STYLES: Record<Analysis["strength"], { text: string; bar: string }> = {
  Weak: { text: "text-destructive", bar: "bg-destructive" },
  Medium: { text: "text-warning", bar: "bg-warning" },
  Strong: { text: "text-primary", bar: "bg-primary" },
};

function Index() {
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [result, setResult] = useState<Analysis | null>(null);
  const [error, setError] = useState("");

  const handleAnalyze = () => {
    if (!password) {
      setError("Please enter a password.");
      setResult(null);
      return;
    }
    setError("");
    setResult(analyzePassword(password));
  };

  const tone = result ? STRENGTH_STYLES[result.strength] : null;

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="animate-rise w-full max-w-xl rounded-2xl border border-border bg-card p-7 shadow-[var(--shadow-card)] sm:p-9">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Password Strength Analyzer
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Test your password against five security rules and get an instant score out of 100.
        </p>

        <div className="mt-7 flex gap-2">
          <input
            type={visible ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
            placeholder="Enter your password"
            autoComplete="new-password"
            aria-label="Password"
            className="flex-1 rounded-xl border border-border bg-input px-4 py-3 text-base outline-none transition-all placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/20"
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="rounded-xl border border-border bg-input px-4 text-sm font-medium text-muted-foreground transition-colors hover:border-ring hover:text-foreground"
          >
            {visible ? "Hide" : "Show"}
          </button>
        </div>

        <button
          type="button"
          onClick={handleAnalyze}
          className="mt-3 w-full rounded-xl bg-[image:var(--gradient-primary)] py-3.5 text-base font-semibold text-primary-foreground transition-all hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0"
        >
          Analyze Password
        </button>

        {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}

        {result && tone ? (
          <div className="animate-rise mt-7">
            <div className="flex items-baseline justify-between">
              <span className={`text-lg font-bold ${tone.text}`}>{result.strength}</span>
              <span className="text-sm tabular-nums text-muted-foreground">
                {result.score} / 100
              </span>
            </div>

            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-surface">
              <div
                className={`h-full rounded-full transition-[width,background-color] duration-700 ease-out ${tone.bar}`}
                style={{ width: `${result.score}%` }}
              />
            </div>

            <ul className="mt-6 grid gap-2.5">
              {result.checks.map((check) => (
                <li
                  key={check.key}
                  className={`flex items-center gap-3 text-sm ${
                    check.passed ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  <span
                    className={`grid size-5.5 flex-none place-items-center rounded-full text-xs ${
                      check.passed
                        ? "bg-primary/15 text-primary"
                        : "bg-destructive/15 text-destructive"
                    }`}
                  >
                    {check.passed ? "✔" : "✕"}
                  </span>
                  {check.label}
                </li>
              ))}
            </ul>

            <div className="mt-6 rounded-xl border border-border bg-surface p-4">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Suggestions
              </h2>
              <ul className="mt-2.5 grid list-disc gap-1.5 pl-5 text-sm">
                {result.suggestions.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}

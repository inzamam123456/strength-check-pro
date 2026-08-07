// Password Strength Analyzer — frontend controller.

const $ = (id) => document.getElementById(id);

const els = {
  password: $("password"),
  toggle: $("toggle"),
  copy: $("copy"),
  analyze: $("analyze"),
  genToggle: $("gen-toggle"),
  generator: $("generator"),
  length: $("length"),
  lengthValue: $("length-value"),
  generate: $("generate"),
  results: $("results"),
  strength: $("strength"),
  score: $("score"),
  meter: $("meter"),
  bar: $("bar"),
  entropy: $("entropy"),
  entropyLabel: $("entropy-label"),
  crackTime: $("crack-time"),
  checklist: $("checklist"),
  warningsBox: $("warnings-box"),
  warnings: $("warnings"),
  suggestions: $("suggestions"),
  export: $("export"),
  error: $("error"),
  toast: $("toast"),
};

// Meter colours: red -> orange -> yellow -> green.
const COLORS = {
  Weak: "#f87171",
  Medium: "#fb923c",
  Good: "#facc15",
  Strong: "#4ade80",
};

let lastAnalysis = null;

/** Show a temporary toast notification. */
function toast(message, isError = false) {
  els.toast.textContent = message;
  els.toast.classList.toggle("error-toast", isError);
  els.toast.classList.add("visible");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => els.toast.classList.remove("visible"), 2600);
}

function showError(message) {
  els.error.textContent = message;
  els.error.classList.remove("hidden");
}

function clearError() {
  els.error.classList.add("hidden");
}

/** POST helper with basic error handling. */
async function postJSON(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}

/** Analyze the current password via the Flask backend. */
async function analyze(value = els.password.value) {
  clearError();
  if (!value) {
    showError("Please enter a password to analyze.");
    els.results.classList.add("hidden");
    return;
  }

  els.analyze.disabled = true;
  els.analyze.classList.add("loading");
  try {
    render(await postJSON("/analyze", { password: value }));
  } catch (err) {
    showError(err.message);
    toast(err.message, true);
  } finally {
    els.analyze.disabled = false;
    els.analyze.classList.remove("loading");
  }
}

/** Render the full report. */
function render(data) {
  lastAnalysis = data;
  els.results.classList.remove("hidden");

  const color = COLORS[data.strength] || COLORS.Weak;
  els.strength.textContent = data.strength;
  els.strength.style.color = color;
  els.score.textContent = `${data.score} / 100`;
  els.bar.style.width = `${data.score}%`;
  els.bar.style.backgroundColor = color;
  els.meter.setAttribute("aria-valuenow", data.score);

  els.entropy.textContent = `${data.entropy} bits`;
  els.entropyLabel.textContent = data.entropy_label;
  els.crackTime.textContent = data.crack_time;

  els.checklist.innerHTML = "";
  Object.entries(data.checks).forEach(([key, passed]) => {
    const li = document.createElement("li");
    li.className = passed ? "pass" : "";
    li.innerHTML =
      `<span class="mark" aria-hidden="true">${passed ? "✔" : "✕"}</span>` +
      `<span>${passed ? "Passed: " : "Failed: "}${data.labels[key]}</span>`;
    els.checklist.appendChild(li);
  });

  fillList(els.warnings, data.warnings);
  els.warningsBox.classList.toggle("hidden", data.warnings.length === 0);
  fillList(els.suggestions, data.suggestions);
}

function fillList(container, items) {
  container.innerHTML = "";
  items.forEach((text) => {
    const li = document.createElement("li");
    li.textContent = text;
    container.appendChild(li);
  });
}

/** Build and download the PDF security report (client side, jsPDF). */
function exportReport() {
  if (!lastAnalysis || !window.jspdf) return;

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  let y = 136;

  const line = (text, size = 11, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.splitTextToSize(text, 480).forEach((part) => {
      if (y > 780) {
        doc.addPage();
        y = 64;
      }
      doc.text(part, 56, y);
      y += 18;
    });
  };

  doc.setFillColor(17, 24, 46);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 96, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Password Security Report", 56, 52);
  doc.setTextColor(20, 20, 20);

  line("Summary", 13, true);
  line(`Score: ${lastAnalysis.score} / 100`);
  line(`Strength: ${lastAnalysis.strength}`);
  line(`Entropy: ${lastAnalysis.entropy} bits (${lastAnalysis.entropy_label})`);
  line(`Estimated crack time: ${lastAnalysis.crack_time}`);
  line(`Analysis timestamp: ${new Date(lastAnalysis.analyzed_at).toLocaleString()}`);

  y += 10;
  line("Requirement checklist", 13, true);
  Object.entries(lastAnalysis.checks).forEach(([key, passed]) => {
    line(`${passed ? "[PASS]" : "[FAIL]"}  ${lastAnalysis.labels[key]}`);
  });

  if (lastAnalysis.warnings.length) {
    y += 10;
    line("Detected weaknesses", 13, true);
    lastAnalysis.warnings.forEach((w) => line(`- ${w}`));
  }

  y += 10;
  line("Suggestions", 13, true);
  lastAnalysis.suggestions.forEach((s) => line(`- ${s}`));

  doc.save(`password-security-report-${Date.now()}.pdf`);
  toast("Security report downloaded");
}

/* ---------- Event wiring ---------- */

els.toggle.addEventListener("click", () => {
  const hidden = els.password.type === "password";
  els.password.type = hidden ? "text" : "password";
  els.toggle.textContent = hidden ? "Hide" : "Show";
  els.toggle.setAttribute("aria-pressed", String(hidden));
  els.toggle.setAttribute("aria-label", hidden ? "Hide password" : "Show password");
});

els.copy.addEventListener("click", async () => {
  if (!els.password.value) return toast("Nothing to copy yet.", true);
  try {
    await navigator.clipboard.writeText(els.password.value);
    toast("Password copied to clipboard");
  } catch {
    toast("Clipboard access was blocked by your browser.", true);
  }
});

els.analyze.addEventListener("click", () => analyze());
els.password.addEventListener("keydown", (e) => e.key === "Enter" && analyze());

els.genToggle.addEventListener("click", () => {
  const open = els.generator.classList.toggle("hidden") === false;
  els.genToggle.setAttribute("aria-expanded", String(open));
});

els.length.addEventListener("input", () => {
  els.lengthValue.textContent = els.length.value;
});

els.generate.addEventListener("click", async () => {
  clearError();
  try {
    const data = await postJSON("/generate", {
      length: Number(els.length.value),
      uppercase: $("opt-uppercase").checked,
      lowercase: $("opt-lowercase").checked,
      numbers: $("opt-numbers").checked,
      symbols: $("opt-symbols").checked,
    });
    els.password.value = data.password;
    els.password.type = "text";
    els.toggle.textContent = "Hide";
    render(data.analysis);
    toast("Strong password generated");
  } catch (err) {
    showError(err.message);
    toast(err.message, true);
  }
});

els.export.addEventListener("click", exportReport);

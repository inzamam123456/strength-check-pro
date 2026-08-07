// Password Strength Analyzer - frontend logic

const input = document.getElementById("password");
const toggle = document.getElementById("toggle");
const analyzeBtn = document.getElementById("analyze");
const results = document.getElementById("results");
const strengthEl = document.getElementById("strength");
const scoreEl = document.getElementById("score");
const bar = document.getElementById("bar");
const checklist = document.getElementById("checklist");
const suggestions = document.getElementById("suggestions");
const errorEl = document.getElementById("error");

// Colors matching the CSS tokens for each strength level.
const COLORS = { Weak: "#f87171", Medium: "#fbbf24", Strong: "#4ade80" };

/** Toggle password visibility. */
toggle.addEventListener("click", () => {
  const hidden = input.type === "password";
  input.type = hidden ? "text" : "password";
  toggle.textContent = hidden ? "Hide" : "Show";
  toggle.setAttribute("aria-label", hidden ? "Hide password" : "Show password");
});

/** Send the password to the Flask backend and render the result. */
async function analyze() {
  const password = input.value;

  errorEl.classList.add("hidden");

  if (!password) {
    errorEl.textContent = "Please enter a password.";
    errorEl.classList.remove("hidden");
    results.classList.add("hidden");
    return;
  }

  try {
    const res = await fetch("/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || "Something went wrong.");
    render(data);
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.classList.remove("hidden");
  }
}

/** Render score, meter, checklist and suggestions. */
function render(data) {
  results.classList.remove("hidden");

  strengthEl.textContent = data.strength;
  strengthEl.style.color = COLORS[data.strength];
  scoreEl.textContent = `${data.score} / 100`;

  bar.style.width = `${data.score}%`;
  bar.style.backgroundColor = COLORS[data.strength];

  // Checklist: one row per rule with a pass/fail mark.
  checklist.innerHTML = "";
  Object.entries(data.checks).forEach(([key, passed]) => {
    const li = document.createElement("li");
    li.className = passed ? "pass" : "";
    li.innerHTML = `<span class="mark">${passed ? "✔" : "✕"}</span><span>${data.labels[key]}</span>`;
    checklist.appendChild(li);
  });

  // Suggestions list.
  suggestions.innerHTML = "";
  data.suggestions.forEach((tip) => {
    const li = document.createElement("li");
    li.textContent = tip;
    suggestions.appendChild(li);
  });
}

analyzeBtn.addEventListener("click", analyze);
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") analyze();
});

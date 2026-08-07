# Password Strength Analyzer

A production-quality password security tool. It scores a password out of 100 using **entropy, character diversity, length and weak-pattern detection**, estimates how long an offline GPU attack would take to crack it, generates cryptographically secure passwords, and exports a PDF security report.

Passwords are never stored, logged, or persisted anywhere.

## Features

- **Entropy analysis** — bits of entropy plus a qualitative rating (Very Weak / Weak / Reasonable / Strong / Very Strong)
- **Crack-time estimation** — based on 10 billion guesses/second (offline GPU attack)
- **Smart scoring (0–100)** — length (30) + character diversity (25) + entropy (45), minus penalties
- **Weak-pattern detection** — common breached passwords, dictionary words (leet-aware), keyboard runs (`qwerty`, `asdf`), repeated characters, sequential characters, repeated blocks
- **Secure generator** — `secrets` (CSPRNG) with length slider (8–32) and character-type toggles
- **Copy to clipboard** with toast notification
- **Animated strength meter** — red → orange → yellow → green
- **Dynamic suggestions** — only the ones relevant to your password
- **PDF security report** — score, strength, entropy, crack time, checklist, warnings, timestamp
- **Accessible** — keyboard navigation, ARIA labels, live regions, visible focus states
- **Responsive** — desktop, tablet and mobile

## Scoring model

| Signal              | Max points | Notes                                 |
| ------------------- | ---------- | ------------------------------------- |
| Length              | 30         | Saturates around 20 characters        |
| Character diversity | 25         | Upper, lower, digits, symbols         |
| Entropy             | 45         | Saturates at 80 bits                  |
| Penalties           | subtracted | Common passwords, patterns, sequences |

| Score  | Strength |
| ------ | -------- |
| 0–39   | Weak     |
| 40–59  | Medium   |
| 60–79  | Good     |
| 80–100 | Strong   |

Entropy bands: `<28` Very Weak, `28–35` Weak, `36–59` Reasonable, `60–127` Strong, `128+` Very Strong.

## Folder structure

```text
Password-Strength-Analyzer/
├── app.py                 # Flask routes only — thin controller layer
├── password_checker.py    # Requirement checks, pattern detection, scoring
├── entropy.py             # Entropy calculation + crack-time modelling
├── generator.py           # Cryptographically secure password generation
├── utils.py               # Validation, JSON errors, pattern helpers
├── requirements.txt
├── Procfile               # gunicorn entry point (Render / Heroku)
├── render.yaml            # Render infrastructure-as-code
├── .env.example
├── .gitignore
├── README.md
├── templates/
│   └── index.html
└── static/
    ├── style.css
    └── script.js
```

## Technologies used

- **Backend:** Python 3.12, Flask 3, Gunicorn
- **Frontend:** HTML5, CSS3 (custom properties, grid, keyframe animations), vanilla JavaScript (Fetch API)
- **PDF export:** jsPDF
- **Security:** `secrets` module (CSPRNG), input validation, no password persistence

## Installation

```bash
git clone <your-repo-url>
cd Password-Strength-Analyzer

python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

pip install -r requirements.txt
cp .env.example .env
```

## Running locally

```bash
python app.py
```

Open http://localhost:5000

## API

| Method | Endpoint    | Description                        |
| ------ | ----------- | ---------------------------------- |
| GET    | `/`         | Homepage                           |
| POST   | `/analyze`  | Analyze a password                 |
| POST   | `/generate` | Generate a secure password         |
| GET    | `/health`   | Health check (used by Render)      |

`POST /analyze` → `{ "password": "MyPass123!" }`

```json
{
  "score": 78,
  "strength": "Good",
  "entropy": 65.5,
  "entropy_label": "Strong",
  "crack_time": "146 years",
  "checks": { "length": true, "uppercase": true, "lowercase": true, "number": true, "special": true },
  "labels": { "length": "Minimum 8 characters" },
  "missing": [],
  "warnings": ["This password contains the common dictionary word \"pass\"."],
  "suggestions": ["Avoid common words; use an unrelated passphrase instead."],
  "analyzed_at": "2026-08-07T17:00:00+00:00"
}
```

`POST /generate` → `{ "length": 16, "uppercase": true, "lowercase": true, "numbers": true, "symbols": true }`

## Deployment (Render)

**Option A — Blueprint:** push the repo and point Render at `render.yaml`.

**Option B — Manual:**

1. New → Web Service → connect the repository
2. Runtime: **Python 3**
3. Build command: `pip install -r requirements.txt`
4. Start command: `gunicorn app:app --workers 2 --threads 4 --timeout 60`
5. Environment variables: `SECRET_KEY` (generate), `FLASK_DEBUG=0`
6. Health check path: `/health`

Render injects `PORT` automatically, which `app.py` respects.

## Screenshots

| Analysis view | Generator |
| ------------- | --------- |
| _Add `screenshots/analysis.png`_ | _Add `screenshots/generator.png`_ |

## Future enhancements

- Have I Been Pwned k-anonymity breach lookup
- Full zxcvbn-style dictionary and l33t scoring
- Rate limiting and CSRF protection
- Multi-language support
- Password history comparison and reuse detection
- Unit test suite with pytest and CI

## License

MIT

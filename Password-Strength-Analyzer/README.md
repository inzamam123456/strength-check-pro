# Password Strength Analyzer

A modern, responsive web app that scores a password out of 100, rates it as **Weak / Medium / Strong**, and explains exactly how to make it better. Built with Flask on the backend and plain HTML/CSS/JavaScript on the frontend.

## Features

- Dark, modern UI with smooth animations and card layout
- Fully responsive (desktop + mobile)
- Password input with show/hide toggle
- Animated strength meter
- Score out of 100 and strength label (Weak / Medium / Strong)
- Checklist for 5 rules: minimum 8 characters, uppercase, lowercase, number, special character
- Actionable suggestions for weak passwords
- Clean, commented, beginner-friendly code

## Scoring

| Rule                 | Points |
| -------------------- | ------ |
| Minimum 8 characters | 20     |
| Uppercase letter     | 20     |
| Lowercase letter     | 20     |
| Number               | 20     |
| Special character    | 20     |

| Score  | Strength |
| ------ | -------- |
| 0–40   | Weak     |
| 41–80  | Medium   |
| 81–100 | Strong   |

## Project structure

```text
Password-Strength-Analyzer/
├── app.py
├── requirements.txt
├── README.md
├── .gitignore
├── templates/
│   └── index.html
└── static/
    ├── style.css
    └── script.js
```

## Installation

```bash
git clone <your-repo-url>
cd Password-Strength-Analyzer

python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate

pip install -r requirements.txt
```

## Running locally

```bash
python app.py
```

Then open http://localhost:5000 in your browser.

## API

`POST /analyze`

Request:

```json
{ "password": "MyPass123!" }
```

Response:

```json
{
  "score": 100,
  "strength": "Strong",
  "checks": { "length": true, "uppercase": true, "lowercase": true, "number": true, "special": true },
  "labels": { "length": "Minimum 8 characters" },
  "missing": [],
  "suggestions": ["Great job! Consider using a passphrase of 16+ characters."]
}
```

## Deploying on Render

1. Push this folder to a GitHub repository.
2. On Render, create a **New Web Service** and connect the repo.
3. Settings:
   - **Environment:** Python 3
   - **Build command:** `pip install -r requirements.txt`
   - **Start command:** `gunicorn app:app`
4. Deploy. Render sets `PORT` automatically, which `app.py` respects.

## Technologies used

- Python 3 / Flask
- Gunicorn (production WSGI server)
- HTML5, CSS3 (custom properties, animations, flex/grid)
- Vanilla JavaScript (Fetch API)

## Screenshots

| Home | Strong password |
| ---- | --------------- |
| _Add `screenshots/home.png`_ | _Add `screenshots/strong.png`_ |

## Future improvements

- Detect common/breached passwords (Have I Been Pwned API)
- Entropy-based scoring and estimated crack time
- Password generator with copy-to-clipboard
- Light/dark theme switch
- Rate limiting and CSRF protection

## License

MIT

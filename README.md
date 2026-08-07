# Password Strength Master

Build a modern, responsive Password Strength Analyzer web application using Python (Flask) as the backend and HTML, CSS, and JavaScript as the frontend.

Requirements:

Frontend:

- Clean, modern UI with a dark theme.

- Responsive design for desktop and mobile.

- Password input field.

- Show/Hide password toggle.

- "Analyze Password" button.

- Animated password strength meter.

- Display password strength as:

  - Weak

  - Medium

  - Strong

- Display a score out of 100.

- Show a checklist indicating:

  ✔ Minimum 8 characters

  ✔ Uppercase letter

  ✔ Lowercase letter

  ✔ Number

  ✔ Special character

- Show suggestions to improve weak passwords.

- Smooth animations and modern cards using CSS.

Backend:

- Flask application.

- Route "/" serves the homepage.

- POST endpoint that analyzes the password.

- Validate:

  - Minimum length

  - Uppercase

  - Lowercase

  - Number

  - Special character

- Return:

  - Score

  - Strength

  - Missing requirements

  - Suggestions

Password Scoring:

- Length: 20 points

- Uppercase: 20 points

- Lowercase: 20 points

- Number: 20 points

- Special Character: 20 points

Strength:

0–40 = Weak

41–80 = Medium

81–100 = Strong

Project Structure:

Password-Strength-Analyzer/

│

├── app.py

├── requirements.txt

├── README.md

├── .gitignore

│

├── templates/

│   └── index.html

│

├── static/

│   ├── style.css

│   └── script.js

README should include:

- Project description

- Features

- Installation

- Running locally

- Technologies used

- Screenshots section

- Future improvements

Code should be clean, modular, and beginner-friendly with comments.

The application should be production-ready and deployable on Render.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/347eeffa-416e-4627-b850-dd658650064e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

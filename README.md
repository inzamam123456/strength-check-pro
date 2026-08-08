# 🔐 Password Strength Analyzer

A modern, privacy-focused web application that analyzes password strength and provides security recommendations based on password characteristics, entropy, and common weak patterns.

## 🌐 Live Demo

https://strength-check-pro.vercel.app

## 📌 Overview

Password Strength Analyzer helps users understand how secure their passwords are without requiring an account.

The application evaluates password characteristics such as length, character diversity, entropy, and potentially weak patterns. It then provides a security score, strength classification, recommendations, and an estimated crack time.

The application also includes a secure password generator for creating stronger passwords.

## ✨ Features

- 🔐 Password strength analysis
- 📊 Security score out of 100
- 📈 Entropy-based analysis
- ⏱️ Estimated crack-time calculation
- 🔠 Uppercase letter detection
- 🔡 Lowercase letter detection
- 🔢 Number detection
- 🔣 Special character detection
- ⚠️ Weak-pattern detection
- 🔄 Repeated character detection
- 🔢 Sequential pattern detection
- 💡 Dynamic security recommendations
- 🎲 Strong password generator
- 📋 Copy generated password
- 👁️ Show/hide password
- 📱 Responsive design
- 🛡️ Privacy-focused password analysis
- 🌙 Modern cybersecurity-themed interface

## 🔒 Privacy & Security

Password analysis is designed to take place locally in the browser.

> Your password stays on your device. The analyzer does not require an account or password submission to use the application.

The project is intended for educational and informational purposes. Password strength and crack-time estimates are approximations and should not be treated as a guarantee of security.

## ⚙️ How It Works

1. Enter a password into the analyzer.
2. The application evaluates the password's characteristics.
3. Password length and character types are checked.
4. Entropy and weak patterns are analyzed.
5. A security score is calculated.
6. The password is classified according to its strength.
7. Suggestions are provided to improve security.
8. Users can generate a stronger password using the password generator.

## 🛠️ Technology Stack

- **React**
- **TypeScript**
- **Vite**
- **HTML5**
- **CSS3**
- **JavaScript / TypeScript**
- **Git & GitHub**
- **Vercel**

## 📂 Project Structure

```text
password-strength-master/
│
├── public/
│
├── src/
│   ├── components/
│   └── ...
│
├── .gitignore
├── package.json
├── tsconfig.json
├── vite.config.ts
├── README.md
└── ...

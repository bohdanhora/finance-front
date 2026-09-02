# 💸 Finance App - Frontend

This is the **frontend** of the Finance App - a personal finance tracker built as a **pet project** by [**Bohdan Hora**](https://github.com/bohdanhora).  
It allows users to manage budgets, visualize expenses, and export data - all from a modern, responsive interface.

## 🌍 Live Demo

- 🔗 [https://finance-front-zeta.vercel.app/](https://finance-front-zeta.vercel.app/)
- 🔗 [https://bohdanhora.github.io/finance-front/](https://bohdanhora.github.io/finance-front/)

---

## ✨ Features

- 🔐 Register an account or log in with **Google**
- 🍪 Session management using cookies
- 💵 Add and categorize **incomes** and **expenses**
- 📊 Automatically calculate:
    - Budget until the end of the current month
    - Budget forecast for the next month
    - Take into account **required (fixed) monthly payments**
- 🔍 Filter and search transactions by **category**
- 📄 Export income/expense lists to **PDF**
- 📈 Track spending with dynamic **charts**
- 💱 Convert UAH to **USD/EUR** using **Monobank exchange rates**
- 🔥 Daily **streak counter** with a flame that changes at 10, 50 and 100 days
- 🌗 Support for **dark** and **light** themes
- 🌍 Available in **English** and **Russian**

---

## 🛠️ Tech Stack

| Tech                      | Description                       |
| ------------------------- | --------------------------------- |
| Next.js 15                | React framework with Turbopack    |
| TypeScript                | Static typing                     |
| Zustand                   | Lightweight state management      |
| Tailwind CSS              | Utility-first styling             |
| Radix UI                  | Accessible UI components          |
| React Hook Form + Zod     | Form validation                   |
| TanStack Query            | Server state and caching          |
| js-cookie                 | Cookie management                 |
| date-fns                  | Date utilities                    |
| react-i18next + next-intl | Internationalization (i18n)       |
| react-toastify            | Toast notifications               |
| Vanta.js + Three.js       | Animated background effects       |
| Monobank API              | UAH ➝ USD/EUR currency conversion |

---

## 📦 Scripts

```bash
npm run dev         # Start development server
npm run build       # Build for production
npm run start       # Start production server
npm run deploy      # Deploy to GitHub Pages
npm run lint        # Lint code
npm run prettier    # Format code using Prettier
```

---

## 🚧 Disclaimer

This project is a personal experiment and learning exercise.
It is not intended for production use.

---

## 👤 Author

**Bohdan Hora**
🔗 GitHub: [@bohdanhora](https://github.com/bohdanhora)

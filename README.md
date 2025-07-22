# 🔖 Link Saver – AI-Powered Bookmark Manager

<div align="center">
  <img src="https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react" />
  <img src="https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css" />
  <img src="https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma" />
</div>

> Save your favorite links with automatic AI summaries and organize them with a clean, modern UI.

## ✨ Features

- 🔐 **Secure Login & JWT Auth**
- 🤖 **AI-Powered Summaries** via Jina AI (no API key needed!)
- 🔍 **Full-Text Smart Search**
- 🌙 **Dark Mode Support**
- ⚡ **Realtime UI Updates**
- 📱 **Mobile-Friendly Design**
- 🧠 **Built with Clean, Scalable Tech Stack**

## 🚀 Live Demo

👉 [https://linksaver-production.up.railway.app/](click here for DEMO)

🧪 **Test Credentials:**
- Email: `test@example.com`
- Password: `password123`


## ⚙️ Tech Stack

| Area         | Technology                  |
|--------------|-----------------------------|
| Frontend     | **Next.js 14**, **React 19**, **Tailwind CSS** |
| Backend      | **Next.js API Routes**      |
| Database     | **SQLite (dev)** + Prisma ORM |
| Auth         | **JWT**, **bcrypt**         |
| AI Summary   | **Jina AI Reader API**      |
| Deployment   | **Vercel**                  |


## 📦 Installation & Setup

### Prerequisites

- Node.js v18+
- npm or yarn

### Clone & Setup

```bash
git clone https://github.com/itguykunal/LinkSaver.git
cd link-saver
npm install
````

### Environment Variables

Create `.env.local` file:

```bash
cp .env.example .env.local
```

Update your `.env.local`:

```env
JWT_SECRET=your-secret-key
DATABASE_URL="file:./dev.db"
```

### Setup Prisma DB

```bash
npx prisma migrate dev
npx prisma db seed
```

### Run Dev Server

```bash
npm run dev
```

Visit: [http://localhost:3000](http://localhost:3000)

---

## 🔧 API Endpoints

| Method | Endpoint                 | Description             | Auth |
| ------ | ------------------------ | ----------------------- | ---- |
| POST   | `/api/auth/register`     | Register a user         | ❌    |
| POST   | `/api/auth/login`        | Login and get JWT token | ❌    |
| GET    | `/api/bookmarks`         | Fetch user's bookmarks  | ✅    |
| POST   | `/api/bookmarks`         | Create a new bookmark   | ✅    |
| DELETE | `/api/bookmarks?id={id}` | Delete a bookmark       | ✅    |

---

---

## 📁 Project Structure

```
link-saver/
├── src/
│   ├── app/
│   │   ├── api/           # API endpoints
│   │   │   ├── auth/      # Login, register
│   │   │   └── bookmarks/ # CRUD operations
│   │   ├── page.tsx       # Home page
│   │   └── layout.tsx     # Layout component
│   ├── components/        # React UI components
│   └── lib/               # Utility & helper functions
├── prisma/                # Database schema & seed
├── public/                # Static files
└── tests/                 # Unit & integration tests
```

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the project
2. Create your feature branch (`git checkout -b feature/feature-name`)
3. Commit your changes (`git commit -m "Add feature"`)
4. Push to the branch (`git push origin feature/feature-name`)
5. Open a Pull Request

---

## 🐛 Known Issues

* SQLite resets on each Vercel deployment – use PostgreSQL in production
* Jina AI API has a rate limit (\~60 requests/hr)

---

## 🚧 Roadmap

* [ ] Tags & category filters
* [ ] Browser extension
* [ ] Bookmark export/import
* [ ] Drag-and-drop sorting
* [ ] Public/Shareable bookmarks
* [ ] OAuth (Google/GitHub) login

---

## 📝 License

This project is licensed under the **MIT License**.
See the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Kunal Krishna** – [@itguykunal](https://github.com/itguykunal)

---

## 🙏 Acknowledgments

* [Jina AI](https://jina.ai/) for their free summarization API
* [Vercel](https://vercel.com) for blazing-fast deployments
* [Prisma](https://prisma.io), [Tailwind CSS](https://tailwindcss.com), and the [Next.js](https://nextjs.org) team for amazing tools

---

<div align="center">
  🚀 Built with ❤️ by <a href="https://github.com/itguykunal">Kunal</a>
</div>

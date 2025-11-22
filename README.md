💰 FinanceManagement AI

A contemporary, AI-enhanced financial tracking web app developed with Next.js 15, offering smart expense categorization, real-time data analytics, and customized financial insights.

## 🌐 Deployment

### Deploy on Vercel - (Thầy có thể truy cập trang web nhanh bằng link dưới đây)

https://ati-final-git-main-nguyeen33.vercel.app?_vercel_share=iZTXOCaTayU7Rv92mkYn585KITmQuLz4


## 🛠️ Tech Stack

### Frontend

- **[Next.js 15](https://nextjs.org)** - React framework with App Router
- **[React 19](https://react.dev)** - Latest React with concurrent features
- **[TypeScript](https://typescriptlang.org)** - Type-safe development
- **[Tailwind CSS](https://tailwindcss.com)** - Utility-first CSS framework
- **[Chart.js](https://chartjs.org)** - Beautiful charts and visualizations

### Backend & Database

- **[Neon](https://get.neon.com/0pFcBSF)** - Serverless PostgreSQL database
- **[Prisma](https://prisma.io)** - Type-safe database ORM
- **Server Actions** - Direct server functions in Next.js

### AI & Authentication

- **[OpenRouter](https://openrouter.ai)** - Free AI API access without credit cards
- **[Clerk](https://go.clerk.com/WSe7K8F)** - Complete authentication solution
- **OpenAI Compatible API** - For intelligent expense categorization


## 🚀 Installation & Execution Guide 

### Prerequisites

- Node.js 18+
- npm, yarn, or pnpm

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/nguyeen33/FinanceManagementAI.git
   cd FinanceManagementAI
   ```

2. **Install dependencies**

   ```bash
   npm install
   

3. **Set up environment variables**
   Create a `.env` file in the root directory:

   ```env
   # Database
   DATABASE_URL="your-neon-database-url"

   # Clerk Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your-clerk-publishable-key"
   CLERK_SECRET_KEY="your-clerk-secret-key"
   NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
   NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL="/"
   NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL="/"

   # OpenRouter AI & AI Model
   OPENROUTER_API_KEY="your-openrouter-api-key"
   OPENROUTER_MODEL=google/gemini-2.5-flash
   # App URL
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

4. **Set up the database**

   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**

   ```bash
   npm run dev
  

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)




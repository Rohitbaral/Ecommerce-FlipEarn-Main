# FlipEarn - MERN Stack Marketplace Platform

FlipEarn is a comprehensive, modern marketplace application built using the MERN stack (MongoDB/PostgreSQL via Prisma, Express, React, Node.js). It provides a seamless experience for users to buy and sell items, communicate via built-in messaging, and for administrators to manage the platform effectively.

## 🚀 Key Features

### User Features
- **Listing Management**: Users can create, update, and delete their own item listings (specifically specialized for social media/platform accounts).
- **Marketplace**: Browse and search for accounts with filters for platform, category, and price.
- **Order Tracking**: Keep track of purchased accounts and their statuses.
- **Messaging System**: Real-time communication between buyers and sellers.
- **Personalized Recommendations**: Smart suggestions based on user behavior and preferences.
- **Secure Payments**: Integrated payment processing for safe transactions.
- **User Authentication**: Secure login and signup powered by Clerk.

### ⚡ Automation & Backend Logic
- **Real-time Sync**: Automated user profile synchronization with Clerk webhooks via Inngest.
- **Automated Credential Delivery**: Secure, automated delivery of account credentials via email upon successful purchase.
- **Email Notifications**: Automated notifications for purchases, listing deletions, and status updates using Nodemailer.

### Admin Features
- **Dashboard**: High-level overview of platform performance with interactive charts.
- **Listing Oversight**: Manage all platform listings, including approvals and removals.
- **Transaction History**: Monitor all financial activities and platform revenue.
- **Withdrawal Management**: Process and track seller payout requests.
- **Credential Verification**: Tools to verify user credentials for trust and safety.
- **Data Export**: Export transactions, listings, and withdrawals to PDF and Excel formats.

## 🛠️ Technology Stack

### Frontend
- **Framework**: [React 19](https://react.dev/)
- **State Management**: [Redux Toolkit](https://redux-toolkit.js.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Authentication**: [Clerk](https://clerk.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Charts**: [Recharts](https://recharts.org/)
- **Routing**: [React Router v7](https://reactrouter.com/)

### Backend
- **Framework**: [Express.js](https://expressjs.com/)
- **Database ORM**: [Prisma](https://www.prisma.io/) (with [Neon Postgres](https://neon.tech/))
- **Background Jobs**: [Inngest](https://www.inngest.com/)
- **Image Handling**: [ImageKit](https://imagekit.io/) & [Multer](https://github.com/expressjs/multer)
- **Email Service**: [Nodemailer](https://nodemailer.com/)
- **Exports**: [ExcelJS](https://github.com/exceljs/exceljs) & [PDFKit](https://pdfkit.org/)

## 📂 Project Structure

```text
FlipEarn/
├── client/                # React Vite frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page-level components (Home, Marketplace, etc.)
│   │   │   └── admin/     # Admin-specific pages
│   │   ├── store/         # Redux store and slices
│   │   └── assets/        # Static images and styles
├── server/                # Node.js Express backend
│   ├── controllers/       # Business logic for routes
│   ├── routes/            # API endpoint definitions
│   ├── prisma/            # Database schema and migrations
│   ├── middlewares/       # Auth and validation middlewares
│   └── inngest/           # Background job functions
└── ALGORITHMS.md          # Technical documentation for platform algorithms
└── README.md              # Project documentation
```

## 🧠 Core Algorithms
FlipEarn implements several custom algorithms for a premium user experience:
- **Personalized Recommendations**: A weighted scoring system for tailored product suggestions.
- **Similar Account Discovery**: Attribute-based matching for product alternatives.
- **Dynamic Search**: Multi-layered filtering and case-insensitive search logic.
- **Admin Analytics**: Real-time revenue aggregation and platform statistics.

For a detailed technical breakdown, please refer to [ALGORITHMS.md](./ALGORITHMS.md).

## ⚙️ Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn
- A Neon Postgres database URL
- Clerk API keys
- ImageKit credentials

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/FlipEarn.git
   cd FlipEarn
   ```

2. **Setup Server**:
   ```bash
   cd server
   npm install
   # Create a .env file and add your credentials (DATABASE_URL, CLERK_SECRET_KEY, etc.)
   npx prisma generate
   npm run server
   ```

3. **Setup Client**:
   ```bash
   cd ../client
   npm install
   # Create a .env file and add CLERK_PUBLISHABLE_KEY
   npm run dev
   ```

## 📄 License
This project is licensed under the ISC License.

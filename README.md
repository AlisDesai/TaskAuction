# TaskAuction 🧾💸  
A real-time task marketplace where users can **post tasks** and **bid to complete them**. Built with the MERN stack, featuring live bidding and a clean user experience.

---

## 📚 Table of Contents
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Quick Start](#-quick-start)
- [API Endpoints](#-api-endpoints)
- [Socket Events](#-socket-events)
- [Authentication Flow](#-authentication-flow)
- [UI Components](#-ui-components)
- [Responsive Design](#-responsive-design)
- [State Management](#-state-management)
- [Environment Variables](#-environment-variables)
- [Security](#-security)
- [Development](#-development)
- [Contributing](#-contributing)

---

## 🚀 Features
- **Task Posting**: Create and manage tasks with title, budget, and deadline
- **Real-time Bidding**: Live bid updates using WebSocket (Socket.io)
- **Bid Acceptance**: Task creators can review and accept bids
- **User Dashboard**: View all posted and active tasks
- **JWT Authentication**: Secure login, session management with refresh tokens

---

## 🛠️ Tech Stack

**Frontend:**
- React.js + Vite
- Redux Toolkit
- TailwindCSS
- Socket.io-client

**Backend:**
- Node.js + Express.js
- MongoDB + Mongoose
- JWT + Bcrypt
- Socket.io (WebSocket)

---

## 📁 Project Structure

```
taskauction/
├── client/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page views
│   │   ├── redux/          # State slices & store
│   │   └── utils/          # Helper functions
├── server/
│   ├── controllers/        # Route logic
│   ├── models/             # MongoDB schemas
│   ├── routes/             # REST API
│   ├── middleware/         # Auth, validation, error handlers
│   └── sockets/            # Real-time socket events
```

---

## ⚙️ Quick Start

### Prerequisites
- Node.js 16+
- MongoDB
- npm/yarn

### Backend Setup
```bash
cd server
npm install
```

Create `.env` file:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/taskauction
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
```

Start backend:
```bash
npm run dev
```

### Frontend Setup
```bash
cd client
npm install
npm run dev
```

---

## 📡 API Endpoints

### Auth Routes
- `POST /api/auth/register` — Register a new user
- `POST /api/auth/login` — Login
- `POST /api/auth/refresh` — Refresh token

### User Routes
- `GET /api/users/profile` — Get profile
- `PUT /api/users/profile` — Update profile

### Task Routes
- `POST /api/tasks` — Create a task
- `GET /api/tasks` — Get all tasks
- `GET /api/tasks/:id` — Get specific task
- `PUT /api/tasks/:id` — Update task
- `DELETE /api/tasks/:id` — Delete task

### Bid Routes
- `POST /api/bids/:taskId` — Place a bid
- `GET /api/bids/:taskId` — View bids on a task
- `PUT /api/bids/:bidId/accept` — Accept a bid

---

## 🔌 Socket Events
- `new_bid` — A new bid is placed
- `bid_accepted` — Bid has been accepted
- `task_updated` — Task details changed
- `task_deleted` — Task was removed

---

## 🔐 Authentication Flow
1. User registers or logs in
2. Server issues JWT access and refresh tokens
3. Access token used for API calls
4. Refresh token maintains session

---

## 🎨 UI Components
- `TaskCard`, `TaskForm`, `BidList`
- `Modal`, `Input`, `Button`, `Toast`, `Spinner`

---

## 📱 Responsive Design
- Mobile-first UI
- TailwindCSS utilities for layout and theming

---

## 🔄 State Management
Redux slices:
- `authSlice` — Auth & session state
- `taskSlice` — All task-related state
- `bidSlice` — Bids and socket sync

---

## 🚦 Environment Variables

Backend `.env` example:
```env
NODE_ENV=development
PORT=5000
MONGO_URI=your_mongo_uri
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
```

---

## 🛡️ Security
- JWT access and refresh token flow
- Input validation middleware
- Rate limiting (e.g., login attempts)
- Passwords hashed with bcrypt

---

## 🧪 Development

```bash
# Backend
cd server && npm run dev

# Frontend
cd client && npm run dev
```

Build frontend for production:
```bash
cd client && npm run build
```

---

## 🤝 Contributing
1. Fork the repo
2. Create feature branch (`git checkout -b feature/xyz`)
3. Commit your changes
4. Push the branch
5. Open a pull request

---

## 📬 Contact
Built by Alis Desai – open to feedback, collaboration, and improvements.

---

<div align="center">
  <h2>🙏 Thank You</h2>
  <p><em>Thank you for using TaskAuction! I hope my platform helps you connect, collaborate, and complete amazing tasks with people around the world.</em></p>
  <p>Happy Bidding! 🌟</p>
</div>

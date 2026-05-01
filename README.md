# TaskCanvas — Team Task Manager

TaskCanvas is a collaborative full-stack task management application designed for modern teams. Built with a beautiful, Figma-inspired monochromatic "warm canvas" design system, it provides a seamless workspace for creating projects, assigning tasks, and tracking team progress.

## ✨ Features

- **User Authentication**: Secure signup and login using JWT with `HTTP-only` cookies.
- **Project Management**: Create projects, add/remove team members, and define Admin/Member roles.
- **Task Board (Kanban)**: Organize tasks by To Do, In Progress, and Done. Inline status updates for rapid workflow.
- **Role-Based Access Control (RBAC)**: Admins have full control over projects and users. Members can only view and update tasks assigned to them.
- **Real-Time Dashboard**: Visualize team productivity with completion rings, status breakdowns, and task-by-user metrics.
- **Premium UI/UX**: Designed with Tailwind CSS and Shadcn UI, featuring pill-geometry, dashed focus indicators, smooth parallax background animations, and staggered micro-interactions.

---

## 🏗️ Tech Stack

| Layer      | Technology                              |
|------------|-----------------------------------------|
| **Frontend** | Next.js 16 (App Router), Tailwind CSS, Shadcn UI, React Query |
| **Backend**  | Python, FastAPI, Uvicorn, Pydantic      |
| **Database** | Neon DB (Serverless PostgreSQL)         |
| **ORM**      | Prisma (via `prisma-client-py`)         |
| **Auth**     | JWT (JSON Web Tokens), bcrypt           |
| **Deployment**| Railway                                |

---

## 🚀 Local Setup Instructions

Follow these steps to run the project locally on your machine.

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [Python](https://www.python.org/) (v3.10+)
- A [Neon DB](https://neon.tech/) account (for PostgreSQL)

### 1. Clone the repository
```bash
git clone <your-github-repo-url>
cd task-manager
```

### 2. Database Setup (Neon)
1. Create a new PostgreSQL database in your Neon dashboard.
2. Copy the connection string.

### 3. Backend Setup
Navigate to the backend directory and set up the Python environment:
```bash
cd backend
python -m venv venv

# On Windows:
.\venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

Create a `.env` file in the `backend/` directory:
```env
DATABASE_URL="postgresql://<user>:<password>@<host>/<db>?sslmode=require"
DIRECT_URL="postgresql://<user>:<password>@<host>/<db>?sslmode=require"
JWT_SECRET="your_super_secret_jwt_key_here"
PORT=8000
```

Push the Prisma database schema and generate the Python client:
```bash
npx prisma@5.17.0 db push
npx prisma@5.17.0 generate
```

Start the FastAPI server:
```bash
uvicorn main:app --reload --port 8000
```
*The backend API will be running at `http://localhost:8000`.*

### 4. Frontend Setup
Open a new terminal window and navigate to the frontend directory:
```bash
cd frontend

# Install dependencies
npm install
```

Create a `.env.local` file in the `frontend/` directory:
```env
NEXT_PUBLIC_API_URL="http://localhost:8000"
```

Start the Next.js development server:
```bash
npm run dev
```
*The frontend application will be running at `http://localhost:3000`.*

---

## ☁️ Deployment Guide (Railway)

This application is configured as a monorepo and is ready to be deployed to **Railway** using the included `railway.toml` file.

### Step-by-Step Deployment:
1. **Push to GitHub**: Ensure all your latest code is committed and pushed to your GitHub repository.
2. **Create a Railway Project**:
   - Go to [Railway.app](https://railway.app/) and click **New Project** -> **Deploy from GitHub repo**.
   - Select your `task-manager` repository.
3. **Configure Environment Variables**:
   In the Railway dashboard, go to the **Variables** tab of your newly created service and add:
   - `DATABASE_URL` (Your Neon connection string)
   - `DIRECT_URL` (Your Neon connection string)
   - `JWT_SECRET` (A strong, random string for production)
   - `NEXT_PUBLIC_API_URL` (The public URL Railway provides for your deployment)
4. **Deploy**:
   - Railway will automatically detect the `railway.toml` file at the root of the repository.
   - It will build the frontend, build the backend, run `prisma generate`, and start the servers using the defined start commands.
5. **Access Application**:
   - Once the deployment is green, click on the generated domain link in Railway to access your live TaskFlow application!

---

## 📁 Project Structure

```
task-manager/
├── frontend/             # Next.js 16 Application
│   ├── src/app/          # App router pages (Dashboard, Projects, etc.)
│   ├── src/components/   # Reusable UI components
│   └── src/lib/          # API client and configurations
├── backend/              # FastAPI Application
│   ├── app/routers/      # API endpoints (Auth, Tasks, Projects, Dashboard)
│   ├── prisma/           # Database schema
│   └── main.py           # Application entry point
├── railway.toml          # Railway deployment configuration
└── README.md             # Project documentation
```

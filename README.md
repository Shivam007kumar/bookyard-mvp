📚 BookYard
BookYard is a web application designed for closed communities (e.g., gated societies, dorms) to facilitate the exchange of books. It utilizes a "Lite Credit Economy" to ensure fair trading and an "Approval-Based Exchange Flow" to build trust.
![alt text](https://img.shields.io/badge/Status-MVP_Complete-success)

![alt text](https://img.shields.io/badge/Stack-FastAPI_React_PostgreSQL-blue)
🚀 Features
🔐 User Authentication: Secure Login & Signup using JWT (JSON Web Tokens).
🪙 Credit Economy:
New users start with 3 Credits.
List a book = Earn +1 Credit.
Request a book = Spend -1 Credit.
📖 Smart Book Listing: Automatically fetches book details (Cover, Title, Author) using ISBN (Google Books API + OpenLibrary Fallback).
🔍 Marketplace: Search books by title or filter by Category (Fiction, Self-Help, etc.).
🤝 Exchange Workflow: A complete state machine for transactions:
Request: User requests a book.
Approve: Owner approves the request (Credit transfer happens here).
Handover: Owner confirms physical handover.
Return: Owner marks book as returned (Book becomes available again).
📱 Responsive Dashboard: Manage incoming requests and outgoing orders in one place.
🛠️ Tech Stack
Frontend
Framework: React (Vite) + TypeScript
Styling: Tailwind CSS
State/API: Axios, React Router DOM
Icons: Lucide React
Backend
Framework: FastAPI (Python)
Database: SQLite (Local MVP) / PostgreSQL (Production)
ORM: SQLAlchemy
Authentication: OAuth2 with Password Bearer (BCrypt hashing)
📂 Project Structure
code
Bash
bookyard-mvp/
├── backend/                # FastAPI Server
│   ├── main.py             # API Endpoints & Logic
│   ├── models.py           # Database Tables
│   ├── schemas.py          # Pydantic Validation Models
│   ├── database.py         # DB Connection
│   ├── requirements.txt    # Python Dependencies
│   └── bookyard.db         # SQLite Database (Auto-generated)
│
├── frontend/               # React Client
│   ├── src/
│   │   ├── pages/          # Home, Dashboard, Login, AddBook
│   │   ├── components/     # Navbar, Cards
│   │   ├── lib/            # API Helper (Axios)
│   └── package.json
│
├── backend-config.json     # AWS App Runner Config
└── amplify-build.yml       # AWS Amplify Config
⚡ Getting Started (Local)
1. Backend Setup
Navigate to the backend folder and start the server.
code
Bash
cd backend

# Create Virtual Environment
python -m venv venv

# Activate (Mac/Linux)
source venv/bin/activate
# Activate (Windows)
# venv\Scripts\activate

# Install Dependencies
pip install -r requirements.txt

# Run Server
uvicorn main:app --reload

2. Frontend Setup
Open a new terminal, navigate to frontend, and start the client.
code
Bash
cd frontend

# Install Dependencies
npm install

# Run Dev Server
npm run dev
The App will run at https://main.d36am1dhijduek.amplifyapp.com
☁️ Deployment (AWS)
The project is configured for deployment using AWS App Runner (Backend) and AWS Amplify (Frontend).
Backend (AWS App Runner)
Using the backend-config.json file:
code
Bash
# 1. Ensure GitHub connection is "AVAILABLE" in AWS Console
# 2. Deploy Service
aws apprunner create-service --cli-input-json file://backend-config.json
Frontend (AWS Amplify)
Using the amplify-build.yml file:
code
Bash
# 1. Create App
aws amplify create-app --name "bookyard-client" --repository "YOUR_REPO_URL" --platform "WEB" --build-spec file://amplify-build.yml --environment-variables "VITE_API_URL=YOUR_APP_RUNNER_URL"

# 2. Create Branch & Deploy
aws amplify create-branch --app-id YOUR_APP_ID --branch-name main
aws amplify start-job --app-id YOUR_APP_ID --branch-name main --job-type RELEASE
📝 API Endpoints
Method	Endpoint	Description
POST	/auth/signup	Register new user (+3 Credits)
POST	/auth/login	Get Access Token
GET	/books	Get all available books (Filter by category/search)
POST	/books	List a new book (+1 Credit)
GET	/books/lookup?isbn=...	Fetch book metadata via ISBN
POST	/transactions/request	Request a book (-1 Credit check)
PUT	/transactions/{id}/{action}	Approve, Handover, or Return a book
📄 License
This project is open-source and available under the MIT License.

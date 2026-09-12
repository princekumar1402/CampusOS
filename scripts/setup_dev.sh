#!/usr/bin/env bash
# =============================================================================
# CampusOS — Development Setup Script
# Run this once to bootstrap your local development environment.
# =============================================================================
set -euo pipefail

echo "🚀 Setting up CampusOS development environment..."

# ---------------------------------------------------------------------------
# Check prerequisites
# ---------------------------------------------------------------------------
command -v python3 >/dev/null 2>&1 || { echo "❌ Python 3.11+ required"; exit 1; }
command -v node >/dev/null 2>&1 || { echo "❌ Node.js 20+ required"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "❌ Docker required"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm required"; exit 1; }

echo "✅ Prerequisites OK"

# ---------------------------------------------------------------------------
# Environment file
# ---------------------------------------------------------------------------
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "📋 Created .env from .env.example — please update with real values"
else
    echo "✅ .env already exists"
fi

# ---------------------------------------------------------------------------
# Backend virtualenv
# ---------------------------------------------------------------------------
if [ ! -d "backend/.venv" ]; then
    echo "📦 Creating Python virtual environment..."
    python3 -m venv backend/.venv
fi

echo "📦 Installing Python dependencies..."
source backend/.venv/bin/activate
pip install --upgrade pip --quiet
pip install -r backend/requirements/dev.txt --quiet
echo "✅ Python dependencies installed"

# ---------------------------------------------------------------------------
# Frontend dependencies
# ---------------------------------------------------------------------------
echo "📦 Installing Node dependencies..."
cd frontend && npm install --quiet && cd ..
echo "✅ Node dependencies installed"

# ---------------------------------------------------------------------------
# Start infrastructure
# ---------------------------------------------------------------------------
echo "🐳 Starting Docker infrastructure (PostgreSQL + Redis)..."
docker compose up -d
sleep 5  # Give services time to start

# ---------------------------------------------------------------------------
# Run migrations
# ---------------------------------------------------------------------------
echo "🗄️ Running database migrations..."
cd backend
source .venv/bin/activate 2>/dev/null || source backend/.venv/bin/activate
alembic upgrade head
cd ..

echo ""
echo "============================================"
echo "✨ CampusOS development environment ready!"
echo "============================================"
echo ""
echo "Start the backend:  cd backend && uvicorn app.main:app --reload"
echo "Start the frontend: cd frontend && npm run dev"
echo ""
echo "Backend API:   http://localhost:8000"
echo "API Docs:      http://localhost:8000/docs"
echo "Frontend:      http://localhost:3000"
echo "Health check:  http://localhost:8000/api/v1/health"

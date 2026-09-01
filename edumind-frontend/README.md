# EduMind

EduMind is a React frontend with a FastAPI backend.

## Run the full project with one command

From the project root (`EduMind project`), run either:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\run-project.ps1
```

or double-click `run-project.bat`. The launcher opens the backend and frontend in separate terminal windows.

Open the app at <http://localhost:5173>. The backend API is available at <http://localhost:8000> and its health check is at <http://localhost:8000/api/health>.

## First-time setup

Install Node.js and Python first. Then install the dependencies once:

```powershell
cd edumind-frontend
npm install

cd ..\edumind-backend
python -m pip install -r requirements.txt
```

The launcher uses `edumind-backend\.venv\Scripts\python.exe` or `venv\Scripts\python.exe` when available. Otherwise, it uses Python from PATH.

## Run services separately

Backend:

```powershell
cd edumind-backend
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Frontend:

```powershell
cd edumind-frontend
npm run dev
```

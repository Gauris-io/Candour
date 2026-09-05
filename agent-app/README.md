# Agentic Cinema Backend

This is the backend service for the Agentic Cinema project, built for the Google Cloud ADK track.

## Setup Instructions

1. **Create a virtual environment:**
   ```bash
   python -m venv venv
   ```

2. **Activate the virtual environment:**
   - On Windows:
     ```bash
     .\venv\Scripts\activate
     ```
   - On macOS/Linux:
     ```bash
     source venv/bin/activate
     ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

## Running the Application

To start the FastAPI development server:

```bash
uvicorn main:app --reload
```

The application will be available at `http://127.0.0.1:8000`.
You can check the health endpoint at `http://127.0.0.1:8000/health`.

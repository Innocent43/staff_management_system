from fastapi import FastAPI

app: FastAPI = FastAPI(title="Staff Attendance Saas")

@app.get("/health")
def health_check():
    return {"status": "ok"}
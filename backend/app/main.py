from fastapi import FastAPI
from app.api import auth,employees,schedules,workplaces,attendance,audit_log,tasks,pay_summaries,wage_rules,reports
from app.core.logging import setup_logging
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings


setup_logging()

app: FastAPI = FastAPI(title="Staff Attendance Saas")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_methods=["GET","POST","PUT","PATCH","DELETE"],
    allow_headers=["Authorization","Content-Type"],
)
app.include_router(auth.router)
app.include_router(employees.router)
app.include_router(schedules.router)
app.include_router(workplaces.router)
app.include_router(attendance.router)
app.include_router(audit_log.router)
app.include_router(tasks.router)
app.include_router(wage_rules.router)
app.include_router(pay_summaries.router)
app.include_router(reports.router)

@app.get("/health")
def health_check():
    return {"status": "ok"}


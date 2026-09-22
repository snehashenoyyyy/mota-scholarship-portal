from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.auth import router as auth_router


from routes.eligibility import router as eligibility_router
from routes.documents import router as documents_router
from routes.applications import router as applications_router

app = FastAPI(title="Scholarship Management API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(eligibility_router, tags=["eligibility"])
app.include_router(documents_router, tags=["documents"])
app.include_router(applications_router, tags=["applications"])
app.include_router(auth_router)
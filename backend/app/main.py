from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import folders, notes
from app.database.connection import engine, Base

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="MyNotes API", description="API for the MyNotes application", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(folders.router, prefix="/api")
app.include_router(notes.router, prefix="/api")

@app.get("/")
def root():
    return {"message": "MyNotes API is running"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
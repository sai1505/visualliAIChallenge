from fastapi import FastAPI

app = FastAPI(title="Visualli AI Challenge")


@app.get("/")
def root():
    return {"message": "Visualli AI Backend is running"}
from fastapi import FastAPI  # type: ignore[import-not-found]

app = FastAPI()


@app.get("/")
def root():
    return {"message": "AI DevOps Platform API is running"}


@app.get("/health")
def health():
    return {"status": "healthy"}
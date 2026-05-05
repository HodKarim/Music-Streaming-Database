from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routes import albums, artists, auth, dashboard, playlists, songs, users


app = FastAPI(title="Music Streaming Database API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(auth.router)
app.include_router(artists.router)
app.include_router(albums.router)
app.include_router(songs.router)
app.include_router(playlists.router)
app.include_router(dashboard.router)


@app.get("/")
def root():
    return {"message": "API is running"}

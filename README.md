# Music-Streaming-Database

## Run backend

1. Start MySQL (creates the docker container for the db):

```
docker compose up -d
```

2. Install dependencies:

```
python3 -m pip install -r backend/requirements.txt
```

3. Start API:

```
uvicorn backend.main:app --reload
```

4. Load data from CSV:

```
python3 -m backend.load_spotify_features --limit 500
```

## Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on http://localhost:3000

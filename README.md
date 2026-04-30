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

## Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on http://localhost:3000

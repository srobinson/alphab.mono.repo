# POC API & Architecture Plan — Alphab Molecule/Vault

## 1. Artifact Ingestion API

- **Endpoint:** `POST /api/artifacts`  
- **Input:** JSON body `{ "url": "https://example.com/article" }`  
- **Process:**  
  - Fetch and extract main content using Python libraries (e.g., `readability-lxml`).  
  - Clean and sanitize content.  
  - Vectorize content using pluggable backend:  
    - External API (OpenAI embeddings)  
    - Local embedding model (e.g., SentenceTransformers)  
  - Store artifact metadata, cleaned text, and vector embedding asynchronously.  
- **Output:** JSON `{ "artifactId": "uuid", "summary": "Extracted summary..." }`

## 2. Query API

- **Endpoint:** `POST /api/query`  
- **Input:** JSON `{ "query": "Explain the main idea of the article" }`  
- **Process:**  
  - Vectorize query using same embedding backend.  
  - Search pgvector index for nearest artifacts.  
- **Output:** JSON list of matching artifacts with scores.

## 3. Content Product Generation API

- **Endpoint:** `POST /api/content-products`  
- **Input:** JSON `{ "artifactIds": ["uuid1", "uuid2"], "prompt": "Create a blog post", "model": "gpt-4", "apiKey": "optional-user-key" }`  
- **Process:**  
  - Call AI generation microservice or external API with selected model and key.  
  - Generate multiple content drafts asynchronously or synchronously for POC.  
- **Output:** JSON with generated drafts.

## 4. Frontend Preview (Optional)

- Minimal React app or static page to:  
  - Submit URLs for ingestion.  
  - Query knowledge base.  
  - View and compare generated content drafts side-by-side.

---

## Example FastAPI Endpoint Snippet (Artifact Ingestion)

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI()

class ArtifactRequest(BaseModel):
    url: str

@app.post("/api/artifacts")
async def ingest_artifact(request: ArtifactRequest):
    # 1. Fetch and extract content (async task)
    # 2. Clean and sanitize
    # 3. Vectorize content
    # 4. Store and return artifact ID and summary
    artifact_id = "generated-uuid"
    summary = "Extracted summary text..."
    return {"artifactId": artifact_id, "summary": summary}

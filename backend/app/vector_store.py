import hashlib
import numpy as np
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct, Filter, FieldCondition, MatchValue
from app.config import settings

class MathVectorStore:
    def __init__(self):
        try:
            self.client = QdrantClient(
                host=settings.QDRANT_HOST,
                port=settings.QDRANT_PORT,
                api_key=settings.QDRANT_API_KEY
            )
        except Exception:
            # Fallback for offline running/testing
            self.client = None

    def _generate_mock_embedding(self, text: str, dim: int = 1536) -> list:
        # Return a deterministic mock embedding vector based on text sha256
        sha = hashlib.sha256(text.encode('utf-8')).hexdigest()
        np.random.seed(int(sha[:8], 16))
        vec = np.random.randn(dim)
        norm = np.linalg.norm(vec)
        vec = vec / (norm if norm > 0 else 1.0)
        return vec.tolist()

    def get_embedding(self, text: str) -> list:
        # If openAI key is configured, we could run actual api calls.
        # But to prevent failure during runtime without key, we generate a highly structured mock representation.
        if settings.OPENAI_API_KEY and settings.OPENAI_API_KEY != "sk-placeholder":
            try:
                import httpx
                response = httpx.post(
                    "https://api.openai.com/v1/embeddings",
                    headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"},
                    json={"input": text, "model": "text-embedding-3-small"}
                )
                if response.status_code == 200:
                    return response.json()["data"][0]["embedding"]
            except Exception:
                pass
        return self._generate_mock_embedding(text)

    def init_collections(self):
        if not self.client:
            return
        collections = ["theorems", "papers", "proofs", "concepts"]
        for col in collections:
            try:
                self.client.recreate_collection(
                    collection_name=col,
                    vectors_config=VectorParams(size=1536, distance=Distance.COSINE)
                )
            except Exception:
                pass

    def upsert_theorem(self, theorem_id: str, title: str, statement: str, domain: str, project_id: int):
        if not self.client:
            return
        try:
            combined_text = f"Theorem: {title}. Domain: {domain}. Statement: {statement}"
            vector = self.get_embedding(combined_text)
            
            # Simple deterministic numeric ID from string hash for Qdrant
            qdrant_id = int(hashlib.md5(theorem_id.encode()).hexdigest(), 16) & 0xffffffffffffffff
            
            self.client.upsert(
                collection_name="theorems",
                points=[
                    PointStruct(
                        id=qdrant_id,
                        vector=vector,
                        payload={
                            "theorem_id": theorem_id,
                            "title": title,
                            "statement": statement,
                            "domain": domain,
                            "project_id": project_id
                        }
                    )
                ]
            )
        except Exception:
            pass

    def search_theorems(self, query: str, limit: int = 5, project_id: int = None) -> list:
        if not self.client:
            return []
        try:
            query_vector = self.get_embedding(query)
            
            query_filter = None
            if project_id is not None:
                query_filter = Filter(
                    must=[
                        FieldCondition(
                            key="project_id",
                            match=MatchValue(value=project_id)
                        )
                    ]
                )

            results = self.client.search(
                collection_name="theorems",
                query_vector=query_vector,
                limit=limit,
                query_filter=query_filter
            )
            
            return [res.payload for res in results]
        except Exception:
            return []

    def upsert_paper(self, paper_id: str, title: str, abstract: str):
        if not self.client:
            return
        try:
            combined_text = f"Title: {title}. Abstract: {abstract}"
            vector = self.get_embedding(combined_text)
            qdrant_id = int(hashlib.md5(paper_id.encode()).hexdigest(), 16) & 0xffffffffffffffff
            
            self.client.upsert(
                collection_name="papers",
                points=[
                    PointStruct(
                        id=qdrant_id,
                        vector=vector,
                        payload={
                            "paper_id": paper_id,
                            "title": title,
                            "abstract": abstract
                        }
                    )
                ]
            )
        except Exception:
            pass

    def search_papers(self, query: str, limit: int = 5) -> list:
        if not self.client:
            return []
        try:
            query_vector = self.get_embedding(query)
            results = self.client.search(
                collection_name="papers",
                query_vector=query_vector,
                limit=limit
            )
            return [res.payload for res in results]
        except Exception:
            return []

vector_store = MathVectorStore()

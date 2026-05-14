import chromadb
from chromadb.utils import embedding_functions
from typing import List, Dict, Optional
import requests
import json

class RAGService:
    def __init__(self):
        self.ollama_url = "http://localhost:11434"
        self.embedding_model = "bge-m3"
        self.chat_model = "medgemma:4b"
        
        # Initialize ChromaDB
        self.chroma_client = chromadb.PersistentClient(path="./chroma_db")
        self.embedding_fn = embedding_functions.OllamaEmbeddingFunction(
            url=self.ollama_url,
            model_name=self.embedding_model
        )
        self.collection = self.chroma_client.get_or_create_collection(
            name="medical_docs",
            embedding_function=self.embedding_fn
        )

    def generate_embedding(self, text: str) -> List[float]:
        """Generate embedding using BGE-M3 model"""
        try:
            response = requests.post(
                f"{self.ollama_url}/api/embeddings",
                json={"model": self.embedding_model, "prompt": text}
            )
            response.raise_for_status()
            return response.json()["embedding"]
        except Exception as e:
            raise Exception(f"Embedding generation failed: {str(e)}")

    def chat(self, query: str, context: str = "") -> str:
        """Chat with MedGemma model"""
        try:
            messages = [
                {
                    "role": "system",
                    "content": "You are a medical AI assistant. Provide accurate, concise answers.",
                },
                {
                    "role": "user", 
                    "content": f"Context: {context}\n\nQuestion: {query}"
                }
            ]
            
            response = requests.post(
                f"{self.ollama_url}/api/generate",
                json={
                    "model": self.chat_model,
                    "prompt": f"Context: {context}\n\nQuestion: {query}",
                    "stream": False
                }
            )
            response.raise_for_status()
            return response.json()["response"]
        except Exception as e:
            raise Exception(f"Chat failed: {str(e)}")

    def add_documents(self, documents: list[Dict[str, str]]):
        """Add documents to vector store with metadata"""
        ids = [str(hash(doc["text"])) for doc in documents]
        texts = [doc["text"] for doc in documents]
        metadatas = [doc.get("metadata", {}) for doc in documents]
        
        self.collection.add(
            ids=ids,
            documents=texts,
            metadatas=metadatas
        )

    def retrieve(self, query: str, n_results: int = 3) -> List[Dict]:
        """Retrieve relevant documents from vector store"""
        results = self.collection.query(
            query_texts=[query],
            n_results=n_results
        )
        
        return [
            {
                "text": doc,
                "metadata": meta,
                "distance": dist
            }
            for doc, meta, dist in zip(
                results["documents"][0],
                results["metadatas"][0],
                results["distances"][0]
            )
        ]

    def rag_chat(self, query: str) -> str:
        """Full RAG pipeline: retrieve relevant docs and generate answer"""
        retrieved = self.retrieve(query)
        context = "\n\n".join([doc["text"] for doc in retrieved])
        return self.chat(query, context)

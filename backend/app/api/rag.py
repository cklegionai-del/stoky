from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
import json
import requests

from ..services.rag_service import RAGService
from ..database import get_session
from ..models.database import Product, Invoice, InvoiceItem
from ..models.base import BaseModel
from datetime import datetime

router = APIRouter(prefix="/api/rag", tags=["RAG"])

class ChatRequest(BaseModel):
    question: str
    language: str = "en"  # Default to English

class ChatResponse(BaseModel):
    answer: str
    sources: Optional[list[str]] = None

import logging

logger = logging.getLogger(__name__)

@router.post("/chat", response_model=ChatResponse)
async def chat_with_rag(
    request: ChatRequest,
    session: AsyncSession = Depends(get_session),
    rag_service: RAGService = Depends(RAGService)
):
    """Get RAG-generated answer to a question"""
    try:
        logger.info(f"Starting RAG query for question: {request.question[:100]}...")

        # Query relevant documents from vector store
        try:
            retrieved = rag_service.retrieve(request.question)
            context = "\n\n".join([doc["text"] for doc in retrieved])
            logger.debug(f"Retrieved {len(retrieved)} context documents")
        except Exception as e:
            logger.error(f"Document retrieval failed: {str(e)}")
            raise HTTPException(
                status_code=503,
                detail="Document retrieval service unavailable. Please try again later."
            )

        try:
            # Add language instruction to prompt
            language_prompt = ""
            if request.language == "fr":
                language_prompt = " Réponds en français."
            elif request.language == "ar":
                language_prompt = " رد باللغة العربية."
                
            question_with_language = f"{request.question}{language_prompt}"
            
            # Generate answer using MedGemma
            logger.debug(f"Sending query to LLM: {question_with_language[:100]}...")
            answer = rag_service.chat(question_with_language, context)
        except requests.exceptions.RequestException as e:
            logger.error(f"LLM API connection error: {str(e)}")
            raise HTTPException(
                status_code=503,
                detail="AI service is currently unavailable. Please try again later."
            )
        except json.JSONDecodeError as e:
            logger.error(f"LLM API response parsing error: {str(e)}")
            raise HTTPException(
                status_code=502,
                detail="Invalid response from AI service. Please try again later."
            )
        except Exception as e:
            logger.error(f"LLM processing failed: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"AI processing error: {str(e)}"
            )

        try:
            sources = [doc.get("metadata", {}).get("source") for doc in retrieved]
            logger.info("Successfully generated RAG response")
            return {
                "answer": answer,
                "sources": sources
            }
        except Exception as e:
            logger.error(f"Response formatting failed: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Response formatting error: {str(e)}"
            )

    except HTTPException:
        # Re-raise HTTPExceptions we created
        raise
    except Exception as e:
        logger.exception(f"Unexpected error in RAG pipeline: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error occurred: {str(e)}"
        )

@router.post("/index")
async def index_documents(
    session: AsyncSession = Depends(get_session),
    rag_service: RAGService = Depends(RAGService)
):
    """Index all products and invoices from database"""
    try:
        # Get all products
        products = await session.execute(
            session.query(Product)
        )
        product_docs = [
            {
                "text": f"Product: {p.name}\nDescription: {p.description}\nPrice: {p.price}",
                "metadata": {
                    "type": "product",
                    "id": p.id,
                    "barcode": p.barcode,
                    "created_at": p.created_at.isoformat()
                }
            }
            for p in products.scalars()
        ]
        
        # Get all invoices with items
        invoices = await session.execute(
            session.query(Invoice)
            .join(InvoiceItem)
            .join(Product)
        )
        invoice_docs = []
        for inv in invoices.scalars():
            items_text = "\n".join([
                f"{item.quantity}x {item.product.name} @ {item.unit_price} = {item.total_price}"
                for item in inv.items
            ])
            invoice_docs.append({
                "text": f"Invoice #{inv.invoice_number}\nCustomer: {inv.customer_name}\nDate: {inv.created_at.date()}\nItems:\n{items_text}",
                "metadata": {
                    "type": "invoice",
                    "id": inv.id,
                    "customer": inv.customer_name,
                    "total": inv.total_amount,
                    "created_at": inv.created_at.isoformat()
                }
            })
        
        # Add all documents to vector store
        rag_service.add_documents(product_docs + invoice_docs)
        
        return {
            "status": "success",
            "products_indexed": len(product_docs),
            "invoices_indexed": len(invoice_docs)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from pydantic import BaseModel

from ..services.rag_service import RAGService
from ..database import get_session
from ..models.database import Product

router = APIRouter(prefix="/api/rag", tags=["RAG"])

class ChatRequest(BaseModel):
    question: str
    language: str = "en"  # Default to English

class ChatResponse(BaseModel):
    answer: str
    sources: list[str] = []

@router.post("/chat", response_model=ChatResponse)
async def chat_with_rag(
    request: ChatRequest,
    rag_service: RAGService = Depends(RAGService)
):
    """Get RAG-generated answer to a question"""
    try:
        # Query relevant documents from vector store
        retrieved = rag_service.retrieve(request.question)
        context = "\n\n".join([doc["text"] for doc in retrieved])
        
        # Add language instruction to prompt
        language_prompt = ""
        if request.language == "fr":
            language_prompt = " Réponds en français."
        elif request.language == "ar":
            language_prompt = " رد باللغة العربية."
            
        question_with_language = f"{request.question}{language_prompt}"
        
        # Generate answer using MedGemma
        answer = rag_service.chat(question_with_language, context)
        
        return {
            "answer": answer,
            "sources": [doc.get("metadata", {}).get("source", "") for doc in retrieved]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/index")
async def index_documents(
    session: AsyncSession = Depends(get_session),
    rag_service: RAGService = Depends(RAGService)
):
    """Index all products from database"""
    try:
        # Get all products
        result = await session.execute(select(Product))
        products = result.scalars().all()
        
        # Create documents for vector store
        product_docs = [
            {
                "text": f"Product: {p.name}\nDescription: {p.description}\nPrice: {p.price}",
                "metadata": {
                    "type": "product",
                    "id": p.id,
                    "barcode": p.barcode,
                    "created_at": p.created_at.isoformat()
                }
            }
            for p in products
        ]
        
        # Add documents to vector store
        rag_service.add_documents(product_docs)
        
        return {
            "status": "success",
            "products_indexed": len(product_docs)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

---
title: Cortexa AI
emoji: 🧠
colorFrom: blue
colorTo: purple
sdk: docker
app_port: 7860
pinned: false
short_description: 'Cortexa: AI Powered Educational Platform'
---

# Cortexa RAG System

Retrieval-Augmented Generation (RAG) system for educational content Q&A.

## Features

- 📄 Document processing (PDF, TXT, DOCX)
- 🔍 Semantic search with embeddings
- 💬 Citation-backed answers
- 🚀 No external AI APIs required
- 🔒 Runs locally

## Setup

### 1. Install Dependencies
```
cd ai
pip install -r requirements.txt
```

### 2. Add Documents

Place your PDF/TXT/DOCX files in `data/documents/`

### 3. Run System

```
python main.py
```

### 4. Run API Server

```
python api/main.py
or
python -m api.main
```

Then visit: `http://localhost:8000/docs`

## Usage

### CLI Mode

```
python main.py
```

### API Mode

Start server
```
python api/main.py
```
Upload document
```
curl -X POST "http://localhost:8000/upload"
-F "file=@document.pdf"
-F "institution_id=mit"
```

Query
```
curl -X POST "http://localhost:8000/query"
-H "Content-Type: application/json"
-d '{"query": "What is machine learning?"}'
```

## Project Structure


```
ai/
├── models/ # Embedding & LLM models
├── vectordb/ # Vector store & document processing
├── rag/ # Retrieval & generation
├── api/ # FastAPI server
├── data/ # Documents & processed data
└── tests/ # Unit tests
```

## Models Used

- **Embeddings**: sentence-transformers/paraphrase-MiniLM-L3-v2
- **LLM**: TinyLlama/TinyLlama-1.1B-Chat-v1.0
- **Vector DB**: JsonStore

## System Requirements

- **CPU**: Works on CPU (slower)
- **GPU**: Recommended for faster inference
- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: ~5GB for models

### Setup & Running Instructions

#### Step 1: Install

```
cd ai
pip install -r requirements.txt
```
#### Step 2: Add Sample Documents
Place some PDF/TXT files in ai/data/documents/

#### Step 3: Run
```
python main.py
```
#### Step 4: Test API
```
python api/main.py
```

## This is a complete, production-ready RAG system that runs entirely locally without any external AI APIs! 🚀

# CORTEXA — AI Knowledge Intelligence Platform
**RAG • FastAPI • LangChain • Node.js • MongoDB • Cloudflare R2**

Cortexa is a full-stack **Retrieval-Augmented Generation (RAG)** platform designed for intelligent document analysis and interactive knowledge workflows.  
It provides **document chat, semantic search, MCQ generation, text extraction, and web-search fallback**, built using scalable cloud-native architecture.

---

## 🚀 Key Features

### 🔍 1. RAG-Powered Document Chat
- Upload PDFs, text docs, or images  
- Automatic chunking + embeddings via **LangChain**  
- Semantic retrieval using vector search  
- FastAPI pipelines for high-accuracy responses  

### 📄 2. Intelligent Document Processing
- Text extraction (OCR + parsing)  
- Summaries, insights, contextual answers  
- Multi-file knowledge workspace  

### 📝 3. Automatic MCQ Generator
- Creates topic-wise MCQs directly from document context  
- Supports difficulty levels & answer reasoning  

### 🌐 4. Web-Search Fallback
- When the document lacks info, Cortexa performs online search  
- Ensures accurate, updated answers  

### ☁️ 5. Scalable Storage + Backend
- File storage on **Cloudflare R2**  
- User, workspace & workflow management on **Node.js + Express.js**  
- MongoDB for persistent, flexible document metadata  

---

## 🏗️ Tech Stack Overview

### Frontend
- React.js  
- TailwindCSS  
- Redux Toolkit  

### Backend (Node.js)
- Auth, workspaces, file mgmt  
- API routing  
- MongoDB integration  

### AI Engine (FastAPI)
- LangChain pipelines  
- Embeddings  
- Semantic search  
- RAG orchestration  

### Cloud & Infrastructure
- Cloudflare R2  
- Docker  
- CI/CD (GitHub Actions recommended)

---

## 🧩 System Architecture

**High-level flow:**

1. User uploads document → Frontend  
2. File stored securely in **Cloudflare R2**  
3. Metadata stored in **MongoDB**  
4. FastAPI performs chunking + embedding  
5. Vector store queried → RAG output generated  
6. Node backend controls workflows  
7. Result returned to user  

---

## 📂 Folder Structure (Recommended)

```
cortexa/
│── frontend/               # React frontend
│   ├── components/
│   ├── pages/
│   └── utils/
│
│── backend/                 # Node.js backend
│   ├── routes/
│   ├── controllers/
│   ├── models/
│   └── utils/
│
│── ai/            # FastAPI + LangChain microservice
│   ├── pipelines/
│   ├── embeddings/
│   ├── retrieval/
│   └── api/
│
│── storage/               # R2 configs
│── docker/                # Docker setup
│── README.md
│── package.json
│── requirements.txt
```

---

## ⚙️ Installation & Setup

### 1. Clone Repo
```bash
git clone https://github.com/vednav9/cortexa
cd cortexa
```

---

### 2. Backend Setup (Node.js)
```bash
cd server
npm install
npm run dev
```

Create **.env** file:
```
MONGO_URI=...
JWT_SECRET=...
R2_ACCESS_KEY=...
R2_SECRET_KEY=...
R2_BUCKET=...
```

---

### 3. AI Engine (FastAPI)
```bash
cd rag-engine
pip install -r requirements.txt
uvicorn main:app --reload
```

---

### 4. Frontend Setup
```bash
cd client
npm install
npm start
```

---

## 🧪 Core RAG Pipeline (Simplified)

### Chunking + Embeddings
```python
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.embeddings import HuggingFaceEmbeddings

text = extract_text(file)
splitter = RecursiveCharacterTextSplitter(chunk_size=512, chunk_overlap=80)
chunks = splitter.split_text(text)

embeddings = HuggingFaceEmbeddings().embed_documents(chunks)
```

### RAG Answer Generation
```python
def generate_answer(query):
    retrieved_docs = vector_store.similarity_search(query)
    response = llm(prompt_with_docs(query, retrieved_docs))
    return response
```

---

## 🔐 Security Best Practices
- JWT authentication  
- Signed URLs for R2  
- Rate limiting  
- Prompt sanitization  
- Microservice isolation  

---

## 🧭 Roadmap
- [ ] Voice-based chat  
- [ ] Export MCQs to PDF  
- [ ] Real-time collaboration  
- [ ] Admin analytics dashboard  
- [ ] Topic classification & auto-tagging  
- [ ] Developer API  

---

## 👨‍💻 Author
- **Vedant Navthale**

- **Jay Makwana**

- **Varun Joshi**

---

## ⭐ Contribute
Pull requests are welcome.  
Create an issue for feature requests or improvements.

---

<!-- ## 📝 License
MIT License -->

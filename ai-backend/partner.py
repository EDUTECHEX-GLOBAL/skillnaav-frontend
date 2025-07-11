from dotenv import load_dotenv
load_dotenv()

import os
import io
import json
import fitz
import boto3
import asyncio
import tempfile
import docx2txt

from fastapi import FastAPI, Form, HTTPException, Query, status, Request
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from datetime import datetime
from urllib.parse import urlparse
from pymongo import MongoClient
from bson import ObjectId
from bson.errors import InvalidId
from sentence_transformers import SentenceTransformer, util
from fastapi import Path

# === Utility ===
def now():
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")

def convert_object_ids(obj):
    if isinstance(obj, list):
        return [convert_object_ids(item) for item in obj]
    elif isinstance(obj, dict):
        return {k: (str(v) if isinstance(v, ObjectId) else convert_object_ids(v)) for k, v in obj.items()}
    else:
        return obj

def extract_school_admin_id(application):
    for key in ["schoolAdmin", "school_admin_id", "schoolAdminId"]:
        val = application.get(key)
        if val:
            return val
    return None

# === Setup ===
print(f"[{now()}] Loading embedding model...")
embedder = SentenceTransformer('all-MiniLM-L6-v2')

db = MongoClient(os.getenv("MONGO_URI")).get_default_database()
print(f"[{now()}] Connected to MongoDB: {db.name}")
shortlist_collection = db["shortlisted_candidates"]
applications_collection = db["applications"]

shortlist_collection.create_index([("internship_id", 1), ("school_admin_id", 1)])
print(f"[{now()}] Created MongoDB indexes")

# === Resume Utilities ===
def download_resume_from_s3(resume_url: str):
    print(f"[{now()}] Downloading resume from: {resume_url}")
    try:
        parsed = urlparse(resume_url)
        bucket = parsed.netloc.split('.')[0]
        key = parsed.path.lstrip('/')
        s3 = boto3.client(
            's3',
            aws_access_key_id=os.getenv("Resume_AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("Resume_AWS_SECRET_ACCESS_KEY"),
            region_name=os.getenv("Resume_AWS_REGION")
        )
        buf = io.BytesIO()
        s3.download_fileobj(bucket, key, buf)
        buf.seek(0)
        return buf
    except Exception as e:
        print(f"[{now()}] S3 Download Error: {e}")
        return None

def extract_text_from_pdf(pdf_file):
    try:
        pdf_file.seek(0)
        text = ""
        with fitz.open(stream=pdf_file.read(), filetype="pdf") as doc:
            for page in doc:
                text += page.get_text("text")
        return text
    except Exception as e:
        print(f"[{now()}] PDF Extract Error: {e}")
        return ""

def extract_text_from_docx(docx_file):
    try:
        docx_file.seek(0)
        with tempfile.NamedTemporaryFile(delete=False, suffix=".docx") as temp_file:
            temp_file.write(docx_file.read())
            temp_path = temp_file.name
        text = docx2txt.process(temp_path)
        os.remove(temp_path)
        return text
    except Exception as e:
        print(f"[{now()}] DOCX Extract Error: {e}")
        return ""

# === Core Resume Processing ===
async def process_resume(resume_url, job_embedding):
    application = await asyncio.get_event_loop().run_in_executor(
        None, lambda: applications_collection.find_one({"resumeUrl": resume_url})
    )

    if not application:
        print(f"[{now()}] No application found for resume: {resume_url}")
        return None

    name = application.get("userName") or application.get("name")
    email = application.get("userEmail") or application.get("email")
    applied_date = application.get("appliedDate") or application.get("applied_date") or application.get("appliedOn")
    student_id = application.get("studentId") or application.get("student_id") or application.get("studentID")
    school_admin_id = application.get("schoolAdmin") 
    # extract_school_admin_id(application)

    if not school_admin_id:
        print(f"[{now()}] B2C candidate (no schoolAdmin): {resume_url}")

    file_stream = await asyncio.get_event_loop().run_in_executor(None, download_resume_from_s3, resume_url)
    if not file_stream:
        return None

    ext = os.path.splitext(urlparse(resume_url).path)[-1].lower()
    print(f"[{now()}] Extracting resume as {ext}")
    if ext == ".pdf":
        text = await asyncio.get_event_loop().run_in_executor(None, extract_text_from_pdf, file_stream)
    elif ext == ".docx":
        text = await asyncio.get_event_loop().run_in_executor(None, extract_text_from_docx, file_stream)
    else:
        print(f"[{now()}] Unsupported file type: {ext}")
        return None

    embedding = embedder.encode(text, convert_to_tensor=True)
    similarity = util.cos_sim(embedding, job_embedding).item()
    print(f"[{now()}] Similarity score for {email}: {similarity:.4f}")

    return {
        "student_id": student_id,
        "name": name,
        "email": email,
        "appliedDate": applied_date,
        "resumeUrl": resume_url,
        "similarity_score": similarity,
        "text": text,
        "school_admin_id": school_admin_id
    }

# === FastAPI App Init ===
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://www.skillnaav.com", "https://skillnaav.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === Optional Middleware for Global Logging ===
@app.middleware("http")
async def log_requests(request: Request, call_next):
    print(f"\n[{now()}] 🔄 Incoming request: {request.method} {request.url}")
    response = await call_next(request)
    print(f"[{now()}] 🔚 Response status: {response.status_code}")
    return response

# === Routes ===

@app.post("/partner/shortlist")
async def shortlist_candidates(
    internship_id: str = Form(...),
    job_description: str = Form(...),
    job_skills: str = Form(...),
    resumes: list[str] = Form(...)
):
    try:
        internship_obj_id = ObjectId(internship_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid internship_id: {e}")

    try:
        job_skills_list = json.loads(job_skills)
    except Exception:
        job_skills_list = []

    if not resumes:
        raise HTTPException(status_code=400, detail="No resumes provided.")

    job_text = job_description + " " + " ".join(job_skills_list)
    job_embedding = embedder.encode(job_text, convert_to_tensor=True)

    tasks = [process_resume(url, job_embedding) for url in resumes]
    results = await asyncio.gather(*tasks)
    candidates = [c for c in results if c and c['similarity_score'] >= 0.3]

    for cand in candidates:
        cand['internship_id'] = internship_obj_id
        try:
            cand['school_admin_id'] = ObjectId(cand['school_admin_id']) if cand.get('school_admin_id') else None
        except Exception:
            cand['school_admin_id'] = None

    candidates = sorted(candidates, key=lambda x: x['similarity_score'], reverse=True)

    if candidates:
        shortlist_collection.insert_many(candidates)

    return {"shortlisted_candidates": convert_object_ids(candidates)}

# ✅ FIRST: Static route (correct order)
@app.get("/partner/shortlisted/by-admin")
async def get_shortlisted_by_admin(
    internship_id: str = Query(...),
    school_admin_id: str = Query(...)
):
    print(f"\n[{now()}] === /partner/shortlisted/by-admin Called ===")
    print(f"[{now()}] Raw Query Params → internship_id: '{internship_id}', school_admin_id: '{school_admin_id}'")

    print(f"[{now()}] Lengths → internship_id: {len(internship_id)}, school_admin_id: {len(school_admin_id)}")
    print(f"[{now()}] Hex Check → internship_id: {internship_id.isalnum()}, school_admin_id: {school_admin_id.isalnum()}")

    try:
        internship_obj_id = ObjectId(internship_id)
    except InvalidId:
        print(f"[{now()}] ❌ Invalid internship_id: {internship_id}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid internship_id: '{internship_id}' is not a valid ObjectId."
        )

    try:
        school_admin_obj_id = ObjectId(school_admin_id)
    except InvalidId:
        print(f"[{now()}] ❌ Invalid school_admin_id: {school_admin_id}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid school_admin_id: '{school_admin_id}' is not a valid ObjectId."
        )

    query = {
        "internship_id": internship_obj_id,
        "school_admin_id": school_admin_obj_id
    }

    print(f"[{now()}] ✅ Final MongoDB Query: {query}")
    try:
        docs = list(shortlist_collection.find(query))
        print(f"[{now()}] ✅ Found {len(docs)} shortlisted candidates.")
        return {"shortlisted_candidates": convert_object_ids(docs)}
    except Exception as e:
        print(f"[{now()}] ❌ MongoDB query failed: {e}")
        raise HTTPException(status_code=500, detail="Database error occurred.")

# ✅ THEN: Dynamic route (must come after)
@app.get("/partner/shortlisted/{internship_id}")
async def get_shortlisted_candidates(
    internship_id: str = Path(..., regex="^[a-fA-F0-9]{24}$")
):

    try:
        internship_obj_id = ObjectId(internship_id)
    except Exception as e:
        print(f"[{now()}] ❌ Invalid dynamic internship_id: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid internship_id '{internship_id}': {e}"
        )

    try:
        docs = list(shortlist_collection.find({"internship_id": internship_obj_id}))
        print(f"[{now()}] ✅ Found {len(docs)} documents")
        return {"shortlisted_candidates": convert_object_ids(docs)}
    except Exception as e:
        print(f"[{now()}] ❌ Error retrieving shortlisted: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@app.get("/partner/fetch-applications/{job_id}")
async def fetch_applications(job_id: str):
    print(f"[{now()}] Fetching applications for job_id: {job_id}")
    try:
        apps = list(applications_collection.find({"job_id": job_id}, {"_id": 0}))
        print(f"[{now()}] ✅ Found {len(apps)} applications")
        return {"applications": convert_object_ids(apps)}
    except Exception as e:
        print(f"[{now()}] ❌ Error fetching applications: {e}")
        return {"error": str(e)}

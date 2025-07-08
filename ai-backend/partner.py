from dotenv import load_dotenv
load_dotenv()

import asyncio
from fastapi import FastAPI, Form, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
import fitz  # PyMuPDF
import os
import io
import json
import docx2txt
import tempfile
from urllib.parse import urlparse
from datetime import datetime
from bson import ObjectId
from sentence_transformers import SentenceTransformer, util
import numpy as np
import boto3
from typing import Optional

# === Globals ===
def now():
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")

def convert_object_ids(obj):
    if isinstance(obj, list):
        return [convert_object_ids(item) for item in obj]
    elif isinstance(obj, dict):
        return {k: (str(v) if isinstance(v, ObjectId) else convert_object_ids(v)) for k, v in obj.items()}
    else:
        return obj

print(f"[{now()}] Loading embedding model...")
embedder = SentenceTransformer('all-MiniLM-L6-v2')

# === MongoDB Setup ===
db = MongoClient(os.getenv("MONGO_URI")).get_default_database()
print(f"[{now()}] Connected to MongoDB: {db.name}")
shortlist_collection = db["shortlisted_candidates"]
applications_collection = db["applications"]

# === FastAPI Setup ===
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://www.skillnaav.com", "https://skillnaav.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === Resume Parsing ===
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
        print(f"[{now()}] S3 Download Error for {resume_url}: {e}")
        return None

def extract_text_from_pdf(pdf_file):
    text = ""
    try:
        pdf_file.seek(0)
        with fitz.open(stream=pdf_file.read(), filetype="pdf") as doc:
            for page in doc:
                text += page.get_text("text")
    except Exception as e:
        print(f"[{now()}] PDF Extract Error: {e}")
    return text

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

async def process_resume(resume_url, job_embedding):
    application = await asyncio.get_event_loop().run_in_executor(
        None, lambda: applications_collection.find_one({"resumeUrl": resume_url})
    )

    name = application.get("userName") or application.get("name") or "N/A" if application else "N/A"
    email = application.get("userEmail") or application.get("email") or "N/A" if application else "N/A"
    applied_date = (application.get("appliedDate") or application.get("applied_date")
                    or application.get("appliedOn") or "N/A") if application else "N/A"
    student_id = (application.get("studentId") or application.get("student_id")
                  or application.get("studentID") or "N/A") if application else "N/A"
    school_admin_id = application.get("schoolAdmin") if application else None

    if not application:
        print(f"[{now()}] No application found for resume: {resume_url}")

    if not school_admin_id:
        print(f"[{now()}] B2C candidate (no schoolAdmin): {resume_url}")

    file_stream = await asyncio.get_event_loop().run_in_executor(None, download_resume_from_s3, resume_url)
    if not file_stream:
        return None

    ext = os.path.splitext(urlparse(resume_url).path)[-1].lower()
    print(f"[{now()}] Extracting resume for {resume_url} as {ext}")
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
        "school_admin_id": school_admin_id  # ✅ May be None
    }

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

    job_text = job_description + " " + " ".join(job_skills_list)
    job_embedding = embedder.encode(job_text, convert_to_tensor=True)

    tasks = [process_resume(url, job_embedding) for url in resumes]
    results = await asyncio.gather(*tasks)

    candidates = [c for c in results if c and c['similarity_score'] >= 0.3]

    for cand in candidates:
        cand['internship_id'] = internship_obj_id
        if cand.get('school_admin_id') and isinstance(cand['school_admin_id'], str):
            cand['school_admin_id'] = ObjectId(cand['school_admin_id'])

    candidates = sorted(candidates, key=lambda x: x['similarity_score'], reverse=True)

    if candidates:
        shortlist_collection.insert_many(candidates)

    return {"shortlisted_candidates": convert_object_ids(candidates)}

@app.get("/partner/shortlisted/{internship_id}")
async def get_shortlisted_candidates(
    internship_id: str,
    school_admin_id: Optional[str] = Query(None, alias="schoolAdminId")
):
    try:
        internship_obj_id = ObjectId(internship_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid internship ID: {e}")

    query = { "internship_id": internship_obj_id }

    if school_admin_id:
        try:
            query["school_admin_id"] = { "$eq": ObjectId(school_admin_id) }
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid schoolAdminId: {e}")

    docs = list(shortlist_collection.find(query))
    return {"shortlisted_candidates": convert_object_ids(docs)}

@app.get("/partner/fetch-applications/{job_id}")
async def fetch_applications(job_id: str):
    try:
        apps = list(db["applications"].find({"job_id": job_id}, {"_id": 0}))
        return {"applications": convert_object_ids(apps)}
    except Exception as e:
        print(f"[{now()}] Error fetching applications: {e}")
        return {"error": str(e)}
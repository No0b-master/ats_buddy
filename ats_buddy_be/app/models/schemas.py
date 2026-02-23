from typing import List, Optional

from pydantic import BaseModel, Field


class ATSCheckRequest(BaseModel):
    resume_text: str = Field(..., min_length=50, description="Raw resume text")
    job_description: str = Field(..., min_length=50, description="Target job description")
    target_role: Optional[str] = Field(default=None, description="Optional target role")
    industry: Optional[str] = Field(default=None, description="Optional target industry")


class ScoreBreakdown(BaseModel):
    keyword_match: float
    section_completeness: float
    readability: float
    uae_market_fit: float


class ATSCheckResponse(BaseModel):
    overall_score: float
    breakdown: ScoreBreakdown
    missing_keywords: List[str]
    matched_keywords: List[str]
    section_gaps: List[str]
    recommendations: List[str]


class ResumeOptimizeRequest(BaseModel):
    resume_text: str = Field(..., min_length=50)
    job_description: Optional[str] = Field(default=None)
    target_role: Optional[str] = Field(default=None)
    preferred_emirate: Optional[str] = Field(default=None)


class ResumeOptimizeResponse(BaseModel):
    optimized_summary: str
    rewritten_bullets: List[str]
    skills_to_add: List[str]
    uae_localization_tips: List[str]


class KeywordGapRequest(BaseModel):
    resume_text: str = Field(..., min_length=50)
    job_description: str = Field(..., min_length=50)


class KeywordGapResponse(BaseModel):
    missing_keywords: List[str]
    high_priority_keywords: List[str]
    coverage_percentage: float


class ResumeExtractResponse(BaseModel):
    file_name: str
    file_type: str
    extracted_text: str
    character_count: int


class RegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., min_length=5, max_length=255)
    password: str = Field(..., min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: str = Field(..., min_length=5, max_length=255)
    password: str = Field(..., min_length=8, max_length=128)


class GoogleAuthRequest(BaseModel):
    id_token: str = Field(..., min_length=20)


class AuthResponse(BaseModel):
    user_id: int
    full_name: str
    email: str
    access_token: str
    token_type: str = "Bearer"


class RegisteredUser(BaseModel):
    user_id: int
    full_name: str
    email: str
    profile_image_url: Optional[str] = None

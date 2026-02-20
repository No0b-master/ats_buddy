import re
from collections import Counter
from io import BytesIO
from typing import List, Set, Tuple

from docx import Document
from fastapi import UploadFile
from pypdf import PdfReader

from app.models.schemas import (
    ATSCheckRequest,
    ATSCheckResponse,
    KeywordGapRequest,
    KeywordGapResponse,
    ResumeExtractResponse,
    ResumeOptimizeRequest,
    ResumeOptimizeResponse,
    ScoreBreakdown,
)


class ATSService:
    REQUIRED_SECTIONS = [
        "summary",
        "experience",
        "skills",
        "education",
    ]

    UAE_KEYWORDS = {
        "uae",
        "gcc",
        "dubai",
        "abu dhabi",
        "emirates",
        "labour law",
        "free zone",
        "visa",
        "residency",
        "mohre",
        "vat",
        "esr",
    }

    STOPWORDS = {
        "the",
        "a",
        "an",
        "to",
        "and",
        "or",
        "of",
        "in",
        "for",
        "on",
        "with",
        "is",
        "are",
        "as",
        "by",
        "be",
        "this",
        "that",
        "from",
        "at",
        "you",
        "your",
        "our",
        "we",
        "will",
        "can",
    }

    SUPPORTED_FILE_TYPES = {"pdf", "docx"}

    def check_ats(self, payload: ATSCheckRequest) -> ATSCheckResponse:
        resume_tokens = self._extract_keywords(payload.resume_text)
        jd_tokens = self._extract_keywords(payload.job_description)

        matched = sorted(jd_tokens.intersection(resume_tokens))
        missing = sorted(jd_tokens.difference(resume_tokens))

        keyword_match_score = self._safe_percentage(len(matched), max(len(jd_tokens), 1))
        section_score, section_gaps = self._evaluate_sections(payload.resume_text)
        readability_score = self._readability_score(payload.resume_text)
        uae_fit_score = self._uae_fit_score(payload.resume_text, payload.job_description)

        overall = round(
            (
                (keyword_match_score * 0.45)
                + (section_score * 0.20)
                + (readability_score * 0.15)
                + (uae_fit_score * 0.20)
            ),
            2,
        )

        recommendations = self._build_recommendations(
            missing_keywords=missing,
            section_gaps=section_gaps,
            readability_score=readability_score,
            uae_fit_score=uae_fit_score,
        )

        return ATSCheckResponse(
            overall_score=overall,
            breakdown=ScoreBreakdown(
                keyword_match=keyword_match_score,
                section_completeness=section_score,
                readability=readability_score,
                uae_market_fit=uae_fit_score,
            ),
            missing_keywords=missing[:25],
            matched_keywords=matched[:25],
            section_gaps=section_gaps,
            recommendations=recommendations,
        )

    def optimize_resume(self, payload: ResumeOptimizeRequest) -> ResumeOptimizeResponse:
        resume_lines = [line.strip() for line in payload.resume_text.splitlines() if line.strip()]
        rewritten_bullets = self._rewrite_bullets_for_impact(resume_lines)

        skills_to_add: List[str] = []
        if payload.job_description:
            gap = self.keyword_gap(
                KeywordGapRequest(
                    resume_text=payload.resume_text,
                    job_description=payload.job_description,
                )
            )
            skills_to_add = gap.high_priority_keywords[:10]

        optimized_summary = self._build_uae_summary(
            payload.resume_text,
            payload.target_role,
            payload.preferred_emirate,
        )

        tips = self._uae_localization_tips(payload.resume_text, payload.preferred_emirate)

        return ResumeOptimizeResponse(
            optimized_summary=optimized_summary,
            rewritten_bullets=rewritten_bullets[:8],
            skills_to_add=skills_to_add,
            uae_localization_tips=tips,
        )

    def keyword_gap(self, payload: KeywordGapRequest) -> KeywordGapResponse:
        resume_tokens = self._extract_keywords(payload.resume_text)
        jd_tokens = self._extract_keywords(payload.job_description)

        missing = sorted(jd_tokens - resume_tokens)
        token_freq = self._token_frequency(payload.job_description)
        high_priority = [token for token, _ in token_freq if token in missing][:15]

        matched = len(jd_tokens.intersection(resume_tokens))
        coverage = round(self._safe_percentage(matched, max(len(jd_tokens), 1)), 2)

        return KeywordGapResponse(
            missing_keywords=missing[:30],
            high_priority_keywords=high_priority,
            coverage_percentage=coverage,
        )

    async def extract_resume_text(self, file: UploadFile) -> ResumeExtractResponse:
        if not file.filename:
            raise ValueError("File name is required")

        extension = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
        if extension not in self.SUPPORTED_FILE_TYPES:
            raise ValueError("Only PDF and DOCX files are supported")

        file_bytes = await file.read()
        if not file_bytes:
            raise ValueError("Uploaded file is empty")

        try:
            if extension == "pdf":
                extracted_text = self._extract_text_from_pdf(file_bytes)
            else:
                extracted_text = self._extract_text_from_docx(file_bytes)
        except Exception as exc:  # parser-level errors
            raise ValueError("Unable to parse the uploaded file. Please upload a valid PDF or DOCX.") from exc

        normalized_text = re.sub(r"\s+", " ", extracted_text).strip()
        if not normalized_text:
            raise ValueError("Could not extract readable text from the uploaded file")

        return ResumeExtractResponse(
            file_name=file.filename,
            file_type=extension,
            extracted_text=normalized_text,
            character_count=len(normalized_text),
        )

    def _extract_text_from_pdf(self, file_bytes: bytes) -> str:
        reader = PdfReader(BytesIO(file_bytes))
        pages = [page.extract_text() or "" for page in reader.pages]
        return "\n".join(pages)

    def _extract_text_from_docx(self, file_bytes: bytes) -> str:
        document = Document(BytesIO(file_bytes))
        return "\n".join(paragraph.text for paragraph in document.paragraphs)

    def _extract_keywords(self, text: str) -> Set[str]:
        tokens = re.findall(r"[A-Za-z][A-Za-z\-\+\.]{1,}", text.lower())
        cleaned = {token.strip("-+.") for token in tokens}
        return {
            token
            for token in cleaned
            if len(token) > 2 and token not in self.STOPWORDS and not token.isnumeric()
        }

    def _token_frequency(self, text: str) -> List[Tuple[str, int]]:
        tokens = re.findall(r"[A-Za-z][A-Za-z\-\+\.]{1,}", text.lower())
        filtered = [
            token.strip("-+.")
            for token in tokens
            if len(token) > 2 and token not in self.STOPWORDS
        ]
        counts = Counter(filtered)
        return sorted(counts.items(), key=lambda item: item[1], reverse=True)

    def _evaluate_sections(self, resume_text: str) -> Tuple[float, List[str]]:
        lower_resume = resume_text.lower()
        gaps = [section for section in self.REQUIRED_SECTIONS if section not in lower_resume]
        score = round(((len(self.REQUIRED_SECTIONS) - len(gaps)) / len(self.REQUIRED_SECTIONS)) * 100, 2)
        return score, gaps

    def _readability_score(self, resume_text: str) -> float:
        words = resume_text.split()
        lines = [line for line in resume_text.splitlines() if line.strip()]
        if not words:
            return 0.0

        avg_words_per_line = len(words) / max(len(lines), 1)
        if avg_words_per_line <= 14:
            return 90.0
        if avg_words_per_line <= 20:
            return 75.0
        if avg_words_per_line <= 28:
            return 60.0
        return 45.0

    def _uae_fit_score(self, resume_text: str, job_description: str) -> float:
        combined = f"{resume_text.lower()} {job_description.lower()}"
        matches = sum(1 for keyword in self.UAE_KEYWORDS if keyword in combined)
        return round(self._safe_percentage(matches, len(self.UAE_KEYWORDS)), 2)

    def _build_recommendations(
        self,
        missing_keywords: List[str],
        section_gaps: List[str],
        readability_score: float,
        uae_fit_score: float,
    ) -> List[str]:
        recommendations: List[str] = []

        if missing_keywords:
            recommendations.append(
                "Add missing job keywords naturally in your experience and skills sections."
            )
        if section_gaps:
            recommendations.append(
                f"Include missing sections: {', '.join(section_gaps)}."
            )
        if readability_score < 70:
            recommendations.append(
                "Use shorter bullet points with measurable outcomes for better ATS readability."
            )
        if uae_fit_score < 30:
            recommendations.append(
                "Add UAE/GCC context like local regulations, visa status, or regional project exposure."
            )

        if not recommendations:
            recommendations.append("Resume is ATS-friendly. Fine-tune with role-specific achievements.")

        return recommendations

    def _rewrite_bullets_for_impact(self, resume_lines: List[str]) -> List[str]:
        action_verbs = [
            "Led",
            "Delivered",
            "Optimized",
            "Implemented",
            "Automated",
            "Improved",
            "Reduced",
            "Increased",
        ]
        rewritten: List[str] = []

        for index, line in enumerate(resume_lines[:12]):
            if len(line.split()) < 4:
                continue
            verb = action_verbs[index % len(action_verbs)]
            sentence = line.rstrip(".")
            rewritten.append(f"{verb} {sentence} with measurable impact across KPIs.")

        return rewritten

    def _build_uae_summary(
        self,
        resume_text: str,
        target_role: str | None,
        preferred_emirate: str | None,
    ) -> str:
        role_text = target_role or "target role"
        emirate_text = preferred_emirate or "UAE"

        top_skills = sorted(self._extract_keywords(resume_text))[:6]
        skill_text = ", ".join(top_skills[:4]) if top_skills else "cross-functional execution"

        return (
            f"Results-driven professional targeting {role_text} opportunities in {emirate_text}, "
            f"with strengths in {skill_text}. Proven ability to deliver business outcomes in "
            "fast-paced, multicultural environments aligned with UAE market expectations."
        )

    def _uae_localization_tips(self, resume_text: str, preferred_emirate: str | None) -> List[str]:
        lower_resume = resume_text.lower()
        tips = []

        if "visa" not in lower_resume:
            tips.append("Add work authorization/visa status for UAE recruiters.")
        if "phone" not in lower_resume and "mobile" not in lower_resume:
            tips.append("Include UAE-reachable contact number with country code.")
        if "linkedin" not in lower_resume:
            tips.append("Add an updated LinkedIn URL.")

        tips.append(
            f"Tailor achievements for hiring trends in {preferred_emirate or 'Dubai/Abu Dhabi'} sectors."
        )
        tips.append("Highlight region-relevant tools, standards, or compliance exposure when applicable.")

        return tips[:6]

    @staticmethod
    def _safe_percentage(part: int | float, whole: int | float) -> float:
        if whole == 0:
            return 0.0
        return round((part / whole) * 100, 2)

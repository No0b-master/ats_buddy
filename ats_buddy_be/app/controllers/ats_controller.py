from fastapi import UploadFile

from app.models.schemas import (
    ATSCheckRequest,
    KeywordGapRequest,
    ResumeOptimizeRequest,
)
from app.services.ats_service import ATSService
from app.views.response_view import success_response


class ATSController:
    def __init__(self) -> None:
        self.service = ATSService()

    def health(self):
        return success_response({"message": "ATS Buddy backend is running"})

    def check_ats(self, payload: ATSCheckRequest):
        result = self.service.check_ats(payload)
        return success_response(result.model_dump())

    def optimize_resume(self, payload: ResumeOptimizeRequest):
        result = self.service.optimize_resume(payload)
        return success_response(result.model_dump())

    def keyword_gap(self, payload: KeywordGapRequest):
        result = self.service.keyword_gap(payload)
        return success_response(result.model_dump())

    async def extract_resume_text(self, file: UploadFile):
        result = await self.service.extract_resume_text(file)
        return success_response(result.model_dump())

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from app.controllers.ats_controller import ATSController
from app.models.schemas import ATSCheckRequest, KeywordGapRequest, RegisteredUser, ResumeOptimizeRequest
from app.services.auth_dependency import get_current_user

router = APIRouter(prefix="/api/v1", tags=["ATS Buddy"])
controller = ATSController()


@router.get("/health")
def health_check():
    return controller.health()


@router.post("/ats/check")
def ats_check(payload: ATSCheckRequest, _: RegisteredUser = Depends(get_current_user)):
    return controller.check_ats(payload)


@router.post("/resume/optimize")
def resume_optimize(payload: ResumeOptimizeRequest, _: RegisteredUser = Depends(get_current_user)):
    return controller.optimize_resume(payload)


@router.post("/resume/keyword-gap")
def resume_keyword_gap(payload: KeywordGapRequest, _: RegisteredUser = Depends(get_current_user)):
    return controller.keyword_gap(payload)


@router.post("/resume/extract-text")
async def resume_extract_text(
    file: UploadFile = File(...),
    _: RegisteredUser = Depends(get_current_user),
):
    try:
        return await controller.extract_resume_text(file)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

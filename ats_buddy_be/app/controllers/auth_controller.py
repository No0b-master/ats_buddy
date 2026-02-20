from app.models.schemas import LoginRequest, RegisterRequest
from app.services.auth_service import AuthService
from app.views.response_view import success_response


class AuthController:
    def __init__(self) -> None:
        self.service = AuthService()

    def register(self, payload: RegisterRequest):
        user = self.service.register(payload)
        return success_response(user.model_dump(), status_code=201)

    def login(self, payload: LoginRequest):
        auth = self.service.login(payload)
        return success_response(auth.model_dump())

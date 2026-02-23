from app.models.schemas import GoogleAuthRequest, LoginRequest, RegisterRequest, RegisteredUser
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

    def google_auth(self, payload: GoogleAuthRequest):
        auth = self.service.google_auth(payload)
        return success_response(auth.model_dump())

    @staticmethod
    def me(current_user: RegisteredUser):
        return success_response(current_user.model_dump())

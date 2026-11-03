from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from . import views

urlpatterns = [
    path(
        "token/refresh/",
        TokenRefreshView.as_view(),
        name="token_refresh",
    ),
    path(
        "login/",
        views.LoginView.as_view(),
        name="login",
    ),
    path(
        "profile/",
        views.AdminProfileView.as_view(),
        name="admin-profile",
    ),
    path(
        "change-password/",
        views.AdminChangePasswordView.as_view(),
        name="admin-change-password",
    ),
]
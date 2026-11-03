
from django.urls import path
from .views import DoctorRegistrationView,DoctorMyProfileView

urlpatterns = [
    path("register/",DoctorRegistrationView.as_view(),name="doctor-register"),
    path(
        "my-profile/",
        DoctorMyProfileView.as_view(),
        name="doctor-my-profile"
    ),
]

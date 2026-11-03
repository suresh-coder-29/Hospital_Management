
from django.urls import path
from .views import PatientRegistrationView,PatientMyProfileView,PatientMedicalHistoryView

urlpatterns = [
    path("register/",PatientRegistrationView.as_view(),name="patient-register"),
     path(
        "my-profile/",
        PatientMyProfileView.as_view(),
        name="patient-my-profile"
    ),
     path(
        "medical-history/",
        PatientMedicalHistoryView.as_view(),
        name="patient-medical-history"
    ),
]

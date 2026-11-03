from django.urls import path

from .views import (
    DoctorAppointmentListView,
    DoctorAppointmentDetailView,
    AvailableDoctorsView,
    DoctorScheduleListView,
    AvailableSlotsView,
    AvailableDatesView,
    PatientBookAppointmentView,
    EmergencyRequestCreateView,
    DoctorEmergencyRequestListView,
    AcceptEmergencyRequestView,
    DoctorAppointmentActionView,
    DoctorConsultationView,
    PatientAppointmentListView,
    AdminPatientListView,
    AdminPatientAppointmentsView,
    AdminDoctorListView,
    AdminDoctorAppointmentsView,
    AdminDoctorApprovalView,

    AdminProfileView,
    AdminChangePasswordView,
    
)

urlpatterns = [
    path(
        "doctor/",
        DoctorAppointmentListView.as_view(),
        name="doctor-appointments",
    ),
    path(
        "doctor/<int:id>/",
        DoctorAppointmentDetailView.as_view(),
        name="doctor-appointment-detail",
    ),

    path(
        "doctors/",
        AvailableDoctorsView.as_view(),
        name="available-doctors",
    ),

    path(
        "schedules/",
        DoctorScheduleListView.as_view(),
        name="doctor-schedules",
    ),
    path(
        "schedules/available/",
        AvailableSlotsView.as_view(),
        name="available-slots",
    ),
    path(
        "schedules/available-dates/",
        AvailableDatesView.as_view(),
        name="available-dates",
    ),

    path(
        "book/",
        PatientBookAppointmentView.as_view(),
        name="book-appointment",
    ),

    path(
        "emergency/",
        EmergencyRequestCreateView.as_view(),
        name="emergency-request-create",
    ),
    path(
        "emergency/doctor/",
        DoctorEmergencyRequestListView.as_view(),
        name="doctor-emergency-requests",
    ),
    path(
        "emergency/<int:id>/accept/",
        AcceptEmergencyRequestView.as_view(),
        name="accept-emergency-request",
    ),
    path(
    "doctor/<int:id>/<str:action>/",
    DoctorAppointmentActionView.as_view(),
    name="doctor-appointment-action"
    ),

    path(
        "doctor/appointments/<int:appointment_id>/consultation/",
        DoctorConsultationView.as_view(),
        name="doctor-consultation"
    ),
    path(
    "patient/",
    PatientAppointmentListView.as_view(),
    name="patient-appointments",
),
    path(
    "admin/patients/",
    AdminPatientListView.as_view(),
    name="admin-patients"
),  
    path(
    "admin/patients/<int:patient_id>/appointments/",
    AdminPatientAppointmentsView.as_view(),
    name="admin-patient-appointments"
),
    path(
        "admin/doctors/",
        AdminDoctorListView.as_view(),
        name="admin-doctors",
    ),
    path(
        "admin/doctors/<int:doctor_id>/appointments/",
        AdminDoctorAppointmentsView.as_view(),
        name="admin-doctor-appointments",
    ),
    path(
    "admin/doctors/<int:doctor_id>/<str:action>/",
    AdminDoctorApprovalView.as_view(),
    name="admin-doctor-approval",
),
    path(
        "profile/",
        AdminProfileView.as_view(),
        name="admin-profile",
    ),
    path(
        "change-password/",
        AdminChangePasswordView.as_view(),
        name="admin-change-password",
    ),
    

]
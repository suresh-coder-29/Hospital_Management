from django.contrib import admin
from .models import (
    Appointment,
    DoctorSchedule,
    EmergencyRequest,
    EmergencyRequestNotification,
)


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "doctor",
        "patient",
        "appointment_date",
        "appointment_time",
        "priority",
        "status",
    )
    list_filter = ("status", "priority", "appointment_date")
    search_fields = (
        "doctor__user__username",
        "patient__user__username",
    )


@admin.register(DoctorSchedule)
class DoctorScheduleAdmin(admin.ModelAdmin):
    list_display = (
        "doctor",
        "day_of_week",
        "start_time",
        "end_time",
        "slot_duration",
        "is_available",
    )
    list_filter = ("day_of_week", "is_available")


@admin.register(EmergencyRequest)
class EmergencyRequestAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "patient",
        "specialization",
        "appointment_date",
        "status",
        "accepted_doctor",
    )
    list_filter = ("status", "specialization")


@admin.register(EmergencyRequestNotification)
class EmergencyRequestNotificationAdmin(admin.ModelAdmin):
    list_display = (
        "emergency_request",
        "doctor",
        "is_seen",
        "created_at",
    )
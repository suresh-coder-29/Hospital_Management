
from django.contrib import admin
from .models import DoctorProfile


@admin.register(DoctorProfile)
class DoctorProfileAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "user",
        "specialization",
        "qualification",
        "experience_years",
        "approval_status"
    )

    list_filter = (
        "specialization",
        "approval_status"
    )

    search_fields = (
        "user__first_name",
        "user__last_name",
        "user__email",
        "medical_license_number"
    )


    list_editable = ("approval_status",)

    readonly_fields = ("created_at",)

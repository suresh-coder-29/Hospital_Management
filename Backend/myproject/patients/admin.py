
from django.contrib import admin
from .models import PatientProfile


@admin.register(PatientProfile)
class PatientProfileAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "user",
        "date_of_birth",
        "gender",
        "blood_group"
    )

    search_fields = (
        "user__first_name",
        "user__last_name",
        "user__email",
        "user__phone_number"
    )

    list_filter = (
        "gender",
        "blood_group"
    )

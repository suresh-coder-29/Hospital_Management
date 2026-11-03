
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):

    list_display = (
        "id",
        "username",
        "email",
        "phone_number",
        "role",
        "is_active",
        "is_staff"
    )

    list_filter = (
        "role",
        "is_active",
        "is_staff"
    )

    fieldsets = UserAdmin.fieldsets + (
        ("Hospital Account Details", {
            "fields": (
                "phone_number",
                "role"
            )
        }),
    )

    add_fieldsets = UserAdmin.add_fieldsets + (
        ("Hospital Account Details", {
            "fields": (
                "email",
                "phone_number",
                "role"
            )
        }),
    )

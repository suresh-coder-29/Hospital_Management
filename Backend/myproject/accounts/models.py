from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):

    class Role(models.TextChoices):
        ADMIN = "ADMIN", "Admin"
        DOCTOR = "DOCTOR", "Doctor"
        PATIENT = "PATIENT", "Patient"

    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=15,unique=True)
    role = models.CharField(max_length=10,choices=Role.choices)

    REQUIRED_FIELDS = ["email", "phone_number", "role"]

    def __str__(self):
        return f"{self.username} - {self.role}"
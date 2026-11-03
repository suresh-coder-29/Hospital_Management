
from django.conf import settings
from django.db import models


class DoctorProfile(models.Model):

    class ApprovalStatus(models.TextChoices):
        PENDING = "PENDING", "Pending"
        APPROVED = "APPROVED", "Approved"
        REJECTED = "REJECTED", "Rejected"

    class Gender(models.TextChoices):
        MALE = "MALE", "Male"
        FEMALE = "FEMALE", "Female"
        OTHER = "OTHER", "Other"

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="doctor_profile"
    )

    date_of_birth = models.DateField()
    gender = models.CharField(max_length=10,choices=Gender.choices)
    qualification = models.CharField(max_length=150)
    specialization = models.CharField(max_length=100,db_index=True)
    experience_years = models.PositiveIntegerField()
    medical_license_number = models.CharField(max_length=100,unique=True)
    consultation_fee = models.DecimalField(max_digits=10,decimal_places=2)
    address = models.TextField()
    profile_image = models.ImageField(upload_to="doctors/profiles/",blank=True,null=True)
    medical_certificate = models.FileField(upload_to="doctors/certificates/",blank=True,null=True)
    approval_status = models.CharField(max_length=10,choices=ApprovalStatus.choices,default=ApprovalStatus.PENDING)
    rejection_reason = models.TextField(blank=True,null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Dr. {self.user.get_full_name()} - {self.specialization}"



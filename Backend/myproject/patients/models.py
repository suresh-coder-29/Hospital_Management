
from django.conf import settings
from django.db import models


class PatientProfile(models.Model):

    class Gender(models.TextChoices):
        MALE = "MALE", "Male"
        FEMALE = "FEMALE", "Female"
        OTHER = "OTHER", "Other"

    class BloodGroup(models.TextChoices):
        A_POSITIVE = "A+", "A+"
        A_NEGATIVE = "A-", "A-"
        B_POSITIVE = "B+", "B+"
        B_NEGATIVE = "B-", "B-"
        AB_POSITIVE = "AB+", "AB+"
        AB_NEGATIVE = "AB-", "AB-"
        O_POSITIVE = "O+", "O+"
        O_NEGATIVE = "O-", "O-"

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="patient_profile"
    )
    
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=10,choices=Gender.choices)
    blood_group = models.CharField(max_length=3,choices=BloodGroup.choices,blank=True,null=True)
    address = models.TextField()
    emergency_contact_name = models.CharField(max_length=150)
    emergency_contact_number = models.CharField(max_length=15)
    profile_image = models.ImageField(upload_to="patients/profiles/",blank=True,null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.user.get_full_name()



class MedicalHistory(models.Model):
    patient = models.ForeignKey(
        "patients.PatientProfile",
        on_delete=models.CASCADE,
        related_name="medical_histories"
    )
    
    appointment = models.OneToOneField(
    "appointments.Appointment",
    on_delete=models.CASCADE,
    related_name="medical_history",
    null=True,
    blank=True
   )

    doctor_name = models.CharField(max_length=150, blank=True)
    specialization = models.CharField(max_length=100, blank=True)

    consultation_date = models.DateField()
    symptoms = models.TextField(blank=True)
    diagnosis = models.TextField()
    treatment = models.TextField(blank=True)
    prescription = models.TextField(blank=True)
    test_results = models.TextField(blank=True)
    allergies = models.TextField(blank=True)
    notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-consultation_date", "-created_at"]

    def __str__(self):
        return f"{self.patient.user.username} - {self.consultation_date}"


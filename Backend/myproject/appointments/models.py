# appointments/models.py

from django.db import models
from django.conf import settings


class Appointment(models.Model):

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        CONFIRMED = "CONFIRMED", "Confirmed"
        COMPLETED = "COMPLETED", "Completed"
        CANCELLED = "CANCELLED", "Cancelled"
        RESCHEDULED = "RESCHEDULED", "Rescheduled"

    class Priority(models.TextChoices):
        NORMAL = "NORMAL", "Normal"
        EMERGENCY = "EMERGENCY", "Emergency"

    doctor = models.ForeignKey(
        "doctors.DoctorProfile",
        on_delete=models.PROTECT,
        related_name="appointments"
    )

    patient = models.ForeignKey(
        "patients.PatientProfile",
        on_delete=models.PROTECT,
        related_name="appointments"
    )

    appointment_date = models.DateField()
    appointment_time = models.TimeField()

    priority = models.CharField(
        max_length=10,
        choices=Priority.choices,
        default=Priority.NORMAL
    )

    reason = models.TextField()

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )

    cancellation_reason = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["appointment_date", "appointment_time"]
        constraints = [
            models.UniqueConstraint(
                fields=["doctor", "appointment_date", "appointment_time"],
                condition=models.Q(
                    status__in=["PENDING", "CONFIRMED", "RESCHEDULED"]
                ),
                name="unique_active_doctor_appointment_slot"
            )
        ]

    def __str__(self):
        return (
            f"{self.patient} - {self.doctor} - "
            f"{self.appointment_date} {self.appointment_time}"
        )


class DoctorSchedule(models.Model):

    DAYS_OF_WEEK = [
        (0, "Monday"),
        (1, "Tuesday"),
        (2, "Wednesday"),
        (3, "Thursday"),
        (4, "Friday"),
        (5, "Saturday"),
        (6, "Sunday"),
    ]

    doctor = models.ForeignKey(
        "doctors.DoctorProfile",
        on_delete=models.CASCADE,
        related_name="schedules"
    )

    day_of_week = models.PositiveSmallIntegerField(
        choices=DAYS_OF_WEEK
    )

    start_time = models.TimeField()
    end_time = models.TimeField()

    slot_duration = models.PositiveIntegerField(default=30)
    is_available = models.BooleanField(default=True)

    class Meta:
        ordering = ["day_of_week", "start_time"]

    def __str__(self):
        return f"{self.doctor} - {self.get_day_of_week_display()}"


class EmergencyRequest(models.Model):

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        ACCEPTED = "ACCEPTED", "Accepted"
        CANCELLED = "CANCELLED", "Cancelled"

    patient = models.ForeignKey(
        "patients.PatientProfile",
        on_delete=models.PROTECT,
        related_name="emergency_requests"
    )

    # Specialization requested by the patient
    specialization = models.CharField(max_length=100)

    appointment_date = models.DateField()
    appointment_time = models.TimeField()
    reason = models.TextField()

    accepted_doctor = models.ForeignKey(
        "doctors.DoctorProfile",
        on_delete=models.PROTECT,
        related_name="accepted_emergency_requests",
        null=True,
        blank=True
    )

    status = models.CharField(
        max_length=15,
        choices=Status.choices,
        default=Status.PENDING
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Emergency #{self.id} - {self.status}"


class EmergencyRequestNotification(models.Model):
    """One notification per matching doctor; not one appointment per doctor."""

    emergency_request = models.ForeignKey(
        EmergencyRequest,
        on_delete=models.CASCADE,
        related_name="notifications"
    )

    doctor = models.ForeignKey(
        "doctors.DoctorProfile",
        on_delete=models.CASCADE,
        related_name="emergency_notifications"
    )

    is_seen = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["emergency_request", "doctor"],
                name="unique_emergency_notification_per_doctor"
            )
        ]
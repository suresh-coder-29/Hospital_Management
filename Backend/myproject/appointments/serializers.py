from rest_framework import serializers
from doctors.models import DoctorProfile
from .models import Appointment, DoctorSchedule, EmergencyRequest


class PatientAppointmentDetailsSerializer(serializers.ModelSerializer):
    username = serializers.CharField(
        source="user.username", read_only=True
    )
    email = serializers.EmailField(
        source="user.email", read_only=True
    )

    class Meta:
        model = Appointment._meta.get_field("patient").related_model
        fields = [
            "id",
            "username",
            "email",
            "date_of_birth",
            "gender",
            "blood_group",
            "address",
            "emergency_contact_name",
            "emergency_contact_number",
        ]


class AppointmentSerializer(serializers.ModelSerializer):
    doctor_name = serializers.CharField(
        source="doctor.user.username", read_only=True
    )
    patient_name = serializers.CharField(
        source="patient.user.username", read_only=True
    )
    patient_details = PatientAppointmentDetailsSerializer(
        source="patient", read_only=True
    )

    class Meta:
        model = Appointment
        fields = [
            "id",
            "doctor",
            "doctor_name",
            "patient",
            "patient_name",
            "patient_details",
            "appointment_date",
            "appointment_time",
            "priority",
            "reason",
            "status",
            "cancellation_reason",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "status",
            "cancellation_reason",
            "created_at",
            "updated_at",
        ]


class DoctorScheduleSerializer(serializers.ModelSerializer):
    day_name = serializers.CharField(
        source="get_day_of_week_display",
        read_only=True
    )

    class Meta:
        model = DoctorSchedule
        fields = [
            "id",
            "doctor",
            "day_of_week",
            "day_name",
            "start_time",
            "end_time",
            "slot_duration",
            "is_available",
        ]


class EmergencyRequestSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(
        source="patient.user.username", read_only=True
    )
    accepted_doctor_name = serializers.CharField(
        source="accepted_doctor.user.username",
        read_only=True,
        allow_null=True
    )

    class Meta:
        model = EmergencyRequest
        fields = [
            "id",
            "patient",
            "patient_name",
            "specialization",
            "appointment_date",
            "appointment_time",
            "reason",
            "accepted_doctor",
            "accepted_doctor_name",
            "status",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "patient",
            "accepted_doctor",
            "status",
            "created_at",
        ]

class AdminDoctorSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source="user.id", read_only=True)
    name = serializers.SerializerMethodField()
    email = serializers.EmailField(source="user.email", read_only=True)
    phone_number = serializers.CharField(
        source="user.phone_number",
        read_only=True
    )

    class Meta:
        model = DoctorProfile
        fields = [
            "id",
            "name",
            "email",
            "phone_number",
            "specialization",
            "qualification",
            "experience_years",
            "approval_status",
            "consultation_fee",
            "address",
            "medical_license_number",
        ]

    def get_name(self, obj):
        user = obj.user
        full_name = user.get_full_name().strip()

        if full_name:
            return full_name

        return user.username

from rest_framework import serializers
from django.db import transaction
from django.utils import timezone

from accounts.serializers import BaseRegistrationSerializer
from accounts.models import User
from .models import PatientProfile,MedicalHistory


class PatientRegistrationSerializer(BaseRegistrationSerializer):

    class Meta(BaseRegistrationSerializer.Meta):
        model = User
        fields = BaseRegistrationSerializer.Meta.fields + [
            "username",
            "email",
            "phone_number",
            "password",
            "confirm_password",
            "date_of_birth",
            "gender",
            "blood_group",
            "address",
            "emergency_contact_name",
            "emergency_contact_number",
            "profile_image"
        ]

    date_of_birth = serializers.DateField()
    gender = serializers.ChoiceField(choices=PatientProfile.Gender.choices)
    blood_group = serializers.ChoiceField(choices=PatientProfile.BloodGroup.choices,required=False,allow_blank=True)
    address = serializers.CharField()
    emergency_contact_name = serializers.CharField(max_length=150)
    emergency_contact_number = serializers.CharField(max_length=15)
    profile_image = serializers.ImageField(required=False)

    def validate_date_of_birth(self, value):
        if value >= timezone.localdate():
            raise serializers.ValidationError(
                "Date of birth must be in the past."
            )
        return value

    def validate_emergency_contact_number(self, value):

        if not value.isdigit():
            raise serializers.ValidationError(
                "Enter a valid emergency contact number."
             )

        if len(value) < 10 or len(value) > 15:
            raise serializers.ValidationError(
                "Enter a valid emergency contact number."
            )

        return value

    def validate_profile_image(self, value):
        if value and value.size > 2 * 1024 * 1024:
            raise serializers.ValidationError(
                "Profile image must be 2 MB or smaller."
            )
        return value

    @transaction.atomic
    def create(self, validated_data):
        profile_fields = [
            "date_of_birth",
            "gender",
            "blood_group",
            "address",
            "emergency_contact_name",
            "emergency_contact_number",
            "profile_image"
        ]

        profile_data = {
            field: validated_data.pop(field, None)
            for field in profile_fields
        }

        user = self.create_user(validated_data,User.Role.PATIENT)

        PatientProfile.objects.create(
            user=user,
            **profile_data
        )

        return user
    
class PatientListSerializer(serializers.ModelSerializer):

    date_of_birth = serializers.DateField(
        source="patient_profile.date_of_birth"
    )

    gender = serializers.CharField(
        source="patient_profile.gender"
    )

    blood_group = serializers.CharField(
        source="patient_profile.blood_group",
        allow_null=True
    )

    address = serializers.CharField(
        source="patient_profile.address"
    )

    emergency_contact_name = serializers.CharField(
        source="patient_profile.emergency_contact_name"
    )

    emergency_contact_number = serializers.CharField(
        source="patient_profile.emergency_contact_number"
    )

    profile_image = serializers.ImageField(
        source="patient_profile.profile_image",
        read_only=True
    )

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "phone_number",
            "role",
            "date_of_birth",
            "gender",
            "blood_group",
            "address",
            "emergency_contact_name",
            "emergency_contact_number",
            "profile_image",
        ]


class MedicalHistorySerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(
        source="patient.user.username",
        read_only=True
    )

    class Meta:
        read_only_fields = ["id", "patient_name", "created_at"]
        model = MedicalHistory
        fields = [
            "id",
            "patient_name",
            "doctor_name",
            "specialization",
            "consultation_date",
            "symptoms",
            "diagnosis",
            "treatment",
            "prescription",
            "test_results",
            "allergies",
            "notes",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "appointment",
            "patient_name",
            "created_at",
        ]
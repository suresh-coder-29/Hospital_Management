
from rest_framework import serializers
from django.db import transaction
from django.utils import timezone

from accounts.serializers import BaseRegistrationSerializer
from accounts.models import User
from .models import DoctorProfile


class DoctorRegistrationSerializer(BaseRegistrationSerializer):

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
            "qualification",
            "specialization",
            "experience_years",
            "medical_license_number",
            "consultation_fee",
            "address",
            "profile_image",
            "medical_certificate"
        ]

    date_of_birth = serializers.DateField()
    gender = serializers.ChoiceField(choices=DoctorProfile.Gender.choices)
    qualification = serializers.CharField(max_length=150)
    specialization = serializers.CharField(max_length=100)
    experience_years = serializers.IntegerField(min_value=0)
    medical_license_number = serializers.CharField(max_length=100)
    consultation_fee = serializers.DecimalField(max_digits=10,decimal_places=2,min_value=0)
    address = serializers.CharField()
    profile_image = serializers.ImageField(required=False)
    medical_certificate = serializers.FileField(required=False)

    def validate_date_of_birth(self, value):
        if value >= timezone.localdate():
            raise serializers.ValidationError(
                "Date of birth must be in the past."
            )
        return value

    def validate_medical_license_number(self, value):
        if DoctorProfile.objects.filter(
            medical_license_number__iexact=value
        ).exists():
            raise serializers.ValidationError(
                "This medical license number is already registered."
            )
        return value

    def validate_profile_image(self, value):
        if value and value.size > 2 * 1024 * 1024:
            raise serializers.ValidationError(
                "Profile image must be 2 MB or smaller."
            )
        return value

    def validate_medical_certificate(self, value):
        if value:
            if value.size > 5 * 1024 * 1024:
                raise serializers.ValidationError(
                    "Medical certificate must be 5 MB or smaller."
                )

            allowed_extensions = (".pdf", ".jpg", ".jpeg", ".png")
            if not value.name.lower().endswith(allowed_extensions):
                raise serializers.ValidationError(
                    "Certificate must be PDF, JPG or PNG."
                )
        return value

    @transaction.atomic
    def create(self, validated_data):
        profile_fields = [
            "date_of_birth",
            "gender",
            "qualification",
            "specialization",
            "experience_years",
            "medical_license_number",
            "consultation_fee",
            "address",
            "profile_image",
            "medical_certificate"
        ]

        profile_data = {
            field: validated_data.pop(field, None)
            for field in profile_fields
        }

        user = self.create_user(
            validated_data,
            User.Role.DOCTOR
        )

        DoctorProfile.objects.create(
            user=user,
            **profile_data
        )

        return user
    

class DoctorMyProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(
        source="user.username",
        read_only=True
    )
    email = serializers.EmailField(
        source="user.email",
        read_only=True
    )
    phone_number = serializers.CharField(
        source="user.phone_number",
        read_only=True
    )
    profile_image_url = serializers.SerializerMethodField()
    medical_certificate_url = serializers.SerializerMethodField()

    class Meta:
        model = DoctorProfile
        fields = [
            "id",
            "username",
            "email",
            "phone_number",
            "date_of_birth",
            "gender",
            "qualification",
            "specialization",
            "experience_years",
            "medical_license_number",
            "consultation_fee",
            "address",
            "profile_image",
            "profile_image_url",
            "medical_certificate",
            "medical_certificate_url",
            "approval_status",
            "rejection_reason",
            "created_at",
        ]

    def get_profile_image_url(self, obj):
        request = self.context.get("request")

        if obj.profile_image:
            url = obj.profile_image.url
            return request.build_absolute_uri(url) if request else url

        return None

    def get_medical_certificate_url(self, obj):
        request = self.context.get("request")

        if obj.medical_certificate:
            url = obj.medical_certificate.url
            return request.build_absolute_uri(url) if request else url

        return None

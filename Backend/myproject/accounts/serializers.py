from rest_framework import serializers
from accounts.models import User


class BaseRegistrationSerializer(serializers.ModelSerializer):

    username = serializers.CharField(
        required=True,
        max_length=150
    )

    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "phone_number",
            "password",
            "confirm_password",
        ]

    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError(
                "Username already exists."
            )
        return value

    def validate(self, data):
        if data["password"] != data["confirm_password"]:
            raise serializers.ValidationError({
                "confirm_password": "Passwords do not match."
            })

        return data

    def create_user(self, validated_data, role):
        validated_data.pop("confirm_password")

        password = validated_data.pop("password")

        return User.objects.create_user(
            password=password,
            role=role,
            **validated_data
        )

from rest_framework import serializers
from .models import ChatMessage


class ChatMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()

    class Meta:
        model = ChatMessage
        fields = [
            "id",
            "appointment",
            "sender",
            "sender_name",
            "content",
            "created_at",
            "is_read",
        ]
        read_only_fields = [
            "id",
            "appointment",
            "sender",
            "sender_name",
            "created_at",
            "is_read",
        ]

    def get_sender_name(self, obj):
        return (
            obj.sender.get_full_name()
            or obj.sender.get_username()
        )

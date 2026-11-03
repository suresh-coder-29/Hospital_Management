
from django.shortcuts import get_object_or_404
from django.db.models import Q, Prefetch

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from appointments.models import Appointment
from .models import ChatMessage
from .serializers import ChatMessageSerializer


def get_user_appointments(user):
    role = getattr(user, "role", None)

    if role == "DOCTOR":
        return Appointment.objects.filter(
            doctor__user=user
        ).select_related(
            "doctor__user",
            "patient__user",
        )

    if role == "PATIENT":
        return Appointment.objects.filter(
            patient__user=user
        ).select_related(
            "doctor__user",
            "patient__user",
        )

    return Appointment.objects.none()


def get_user_appointment(user, appointment_id):
    return get_object_or_404(
        get_user_appointments(user),
        id=appointment_id
    )


def display_name(user):
    return (
        user.get_full_name()
        or user.get_username()
    )


class ChatConversationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        appointments = get_user_appointments(request.user).order_by(
            "-appointment_date",
            "-appointment_time"
        )

        data = []

        for appointment in appointments:
            latest_message = (
                ChatMessage.objects
                .filter(appointment=appointment)
                .order_by("-created_at")
                .first()
            )

            if request.user.role == "DOCTOR":
                other_user = appointment.patient.user
            else:
                other_user = appointment.doctor.user

            data.append({
                "appointment_id": appointment.id,
                "other_user_name": display_name(other_user),
                "appointment_date": appointment.appointment_date,
                "appointment_time": appointment.appointment_time,
                "appointment_status": appointment.status,
                "last_message": (
                    latest_message.content
                    if latest_message else ""
                ),
                "last_message_time": (
                    latest_message.created_at
                    if latest_message else None
                ),
            })

        return Response(data)


class ChatMessagesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, appointment_id):
        appointment = get_user_appointment(
            request.user, appointment_id
        )

        messages = ChatMessage.objects.filter(
            appointment=appointment
        ).select_related("sender")

        # Mark only messages sent by the other person as read.
        messages.filter(is_read=False).exclude(
            sender=request.user
        ).update(is_read=True)

        serializer = ChatMessageSerializer(
            messages, many=True
        )
        return Response(serializer.data)

    def post(self, request, appointment_id):
        appointment = get_user_appointment(
            request.user, appointment_id
        )

        content = str(request.data.get("content", "")).strip()

        if not content:
            return Response(
                {"error": "Message cannot be empty."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if len(content) > 5000:
            return Response(
                {"error": "Message is too long."},
                status=status.HTTP_400_BAD_REQUEST
            )

        message = ChatMessage.objects.create(
            appointment=appointment,
            sender=request.user,
            content=content
        )

        serializer = ChatMessageSerializer(message)
        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED
        )

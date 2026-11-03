# appointments/views.py

from datetime import date as date_class, datetime, timedelta

from django.db import transaction
from django.utils import timezone

from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.shortcuts import get_object_or_404
from django.db import IntegrityError, transaction
from django.contrib.auth import update_session_auth_hash

from doctors.models import DoctorProfile
from patients.models import PatientProfile
from patients.serializers import MedicalHistorySerializer
from patients.models import MedicalHistory

from .models import (
    Appointment,
    DoctorSchedule,
    EmergencyRequest,
    EmergencyRequestNotification,
)
from .serializers import (
    AppointmentSerializer,
    DoctorScheduleSerializer,
    EmergencyRequestSerializer,
    AdminDoctorSerializer,
)


# ---------------- HELPERS ----------------

def get_patient_profile(user):
    try:
        return PatientProfile.objects.get(user=user)
    except PatientProfile.DoesNotExist:
        raise PermissionDenied("Patient profile not found.")


def get_doctor_profile(user):
    try:
        return DoctorProfile.objects.get(user=user)
    except DoctorProfile.DoesNotExist:
        raise PermissionDenied("Doctor profile not found.")


def get_available_slots(doctor, appointment_date):
    """
    Returns the time slots configured for this doctor on this weekday,
    excluding slots already booked with active statuses.
    """
    schedules = DoctorSchedule.objects.filter(
        doctor=doctor,
        day_of_week=appointment_date.weekday(),
        is_available=True,
    )

    booked_times = set(
        Appointment.objects.filter(
            doctor=doctor,
            appointment_date=appointment_date,
            status__in=[
                Appointment.Status.PENDING,
                Appointment.Status.CONFIRMED,
                Appointment.Status.RESCHEDULED,
            ],
        ).values_list("appointment_time", flat=True)
    )

    slots = []

    for schedule in schedules:
        current = datetime.combine(
            appointment_date, schedule.start_time
        )
        end = datetime.combine(
            appointment_date, schedule.end_time
        )

        while current + timedelta(
            minutes=schedule.slot_duration
        ) <= end:
            slot_time = current.time()

            # Don't offer past slots for today.
            if appointment_date == timezone.localdate():
                now = timezone.localtime().time()
                if slot_time <= now:
                    current += timedelta(minutes=schedule.slot_duration)
                    continue

            if slot_time not in booked_times:
                slots.append(slot_time.strftime("%H:%M"))

            current += timedelta(minutes=schedule.slot_duration)

    return sorted(set(slots))


# ---------------- EXISTING DOCTOR APPOINTMENT LIST ----------------

class DoctorAppointmentListView(generics.ListAPIView):
    serializer_class = AppointmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if user.role != "DOCTOR":
            raise PermissionDenied(
                "Only doctors can view their appointments."
            )

        doctor_profile = get_doctor_profile(user)

        return Appointment.objects.filter(
            doctor=doctor_profile
        ).select_related(
            "doctor__user",
            "patient__user",
        ).order_by(
            "-appointment_date",
            "-appointment_time",
        )

# ---------------- PATIENT APPOINTMENT LIST ----------------

class PatientAppointmentListView(generics.ListAPIView):
    serializer_class = AppointmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if user.role != "PATIENT":
            raise PermissionDenied(
                "Only patients can view their appointments."
            )

        patient = get_patient_profile(user)

        return Appointment.objects.filter(
            patient=patient
        ).select_related(
            "doctor__user",
            "patient__user",
        ).order_by(
            "-appointment_date",
            "-appointment_time",
        )


# ---------------- EXISTING DOCTOR APPOINTMENT DETAIL ----------------

class DoctorAppointmentDetailView(generics.RetrieveAPIView):
    serializer_class = AppointmentSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = "id"

    def get_queryset(self):
        user = self.request.user

        if user.role != "DOCTOR":
            raise PermissionDenied(
                "Only doctors can view appointment details."
            )

        doctor_profile = get_doctor_profile(user)

        return Appointment.objects.filter(
            doctor=doctor_profile
        ).select_related(
            "doctor__user",
            "patient__user",
        )


# ---------------- DOCTOR LIST FOR PATIENT BOOKING ----------------


class AvailableDoctorsView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request):
        doctors = DoctorProfile.objects.filter(
            approval_status="APPROVED"
        ).select_related("user")

        data = [
            {
                "id": doctor.id,
                "name": (
                    doctor.user.get_full_name()
                    or doctor.user.username
                ),
                "specialization": doctor.specialization,
                "qualification": doctor.qualification,
                "experience_years": doctor.experience_years,
                "consultation_fee": str(doctor.consultation_fee),
            }
            for doctor in doctors
        ]

        return Response(data)
# ---------------- AVAILABLE SCHEDULES ----------------

class DoctorScheduleListView(generics.ListAPIView):
    serializer_class = DoctorScheduleSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        doctor_id = self.request.query_params.get("doctor_id")

        if not doctor_id:
            return DoctorSchedule.objects.none()

        return DoctorSchedule.objects.filter(
            doctor_id=doctor_id,
            is_available=True,
        )


# ---------------- AVAILABLE TIME SLOTS ----------------

class AvailableSlotsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # 1. Check patient role
        if request.user.role != "PATIENT":
            return Response(
                {"error": "Only patients can view available slots."},
                status=status.HTTP_403_FORBIDDEN
            )

        # 2. Get query parameters
        doctor_id = request.query_params.get("doctor_id")
        selected_date = request.query_params.get("date")

        if not doctor_id or not selected_date:
            return Response(
                {"error": "doctor_id and date are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 3. Validate date
        try:
            appointment_date = date_class.fromisoformat(selected_date)
        except ValueError:
            return Response(
                {"error": "Invalid date format. Use YYYY-MM-DD."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 4. Check past date
        if appointment_date < date_class.today():
            return Response(
                {"error": "Cannot view slots for a past date."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 5. Check approved doctor
        try:
            doctor = DoctorProfile.objects.get(
                id=doctor_id,
                approval_status="APPROVED"
            )
        except (DoctorProfile.DoesNotExist, ValueError):
            return Response(
                {"error": "Approved doctor not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        # 6. Fetch available slots
        slots = get_available_slots(doctor, appointment_date)

        # 7. Return response
        return Response(
            {
                "doctor_id": doctor.id,
                "doctor_name": (
                    doctor.user.get_full_name()
                    or doctor.user.username
                ),
                "date": selected_date,
                "available_slots": slots,
            },
            status=status.HTTP_200_OK
        )


        # Continue with your existing doctor and schedule logic

# ---------------- NORMAL APPOINTMENT BOOKING ----------------

class PatientBookAppointmentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role != "PATIENT":
            raise PermissionDenied(
                "Only patients can book appointments."
            )

        try:
            patient = PatientProfile.objects.get(user=request.user)
        except PatientProfile.DoesNotExist:
            return Response(
                {"error": "Patient profile not found."},
                status=status.HTTP_403_FORBIDDEN,
            )

        doctor_id = request.data.get("doctor_id")
        date_string = request.data.get("appointment_date")
        reason = request.data.get("reason", "").strip()

        if not all([doctor_id, date_string, reason]):
            return Response(
                {
                    "error": (
                        "doctor_id, appointment_date and reason are required."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            appointment_date = date_class.fromisoformat(date_string)
        except (ValueError, TypeError):
            return Response(
                {"error": "Invalid date. Use YYYY-MM-DD."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if appointment_date < timezone.localdate():
            return Response(
                {"error": "Cannot book an appointment in the past."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            doctor = DoctorProfile.objects.get(
                id=doctor_id,
                approval_status="APPROVED",
            )
        except (DoctorProfile.DoesNotExist, ValueError, TypeError):
            return Response(
                {"error": "Approved doctor not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Assign the first available time automatically.
        with transaction.atomic():
            slots = get_available_slots(doctor, appointment_date)

            for slot_string in slots:
                slot_time = datetime.strptime(
                    slot_string, "%H:%M"
                ).time()

                try:
                    with transaction.atomic():
                        appointment = Appointment.objects.create(
                            doctor=doctor,
                            patient=patient,
                            appointment_date=appointment_date,
                            appointment_time=slot_time,
                            priority=Appointment.Priority.NORMAL,
                            reason=reason,
                            status=Appointment.Status.PENDING,
                        )

                    return Response(
                        {
                            "message": (
                                "Appointment booked successfully. "
                                "Time assigned automatically."
                            ),
                            "appointment": AppointmentSerializer(
                                appointment
                            ).data,
                        },
                        status=status.HTTP_201_CREATED,
                    )

                except IntegrityError:
                    # Another request may have booked this slot.
                    continue

        return Response(
            {
                "error": (
                    "No available slots remain on this date. "
                    "Please select another date."
                )
            },
            status=status.HTTP_409_CONFLICT,
        )


# ---------------- EMERGENCY REQUEST ----------------

class EmergencyRequestCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role != "PATIENT":
            raise PermissionDenied(
                "Only patients can create emergency requests."
            )

        try:
            patient = PatientProfile.objects.get(user=request.user)
        except PatientProfile.DoesNotExist:
            return Response(
                {"error": "Patient profile not found."},
                status=status.HTTP_403_FORBIDDEN,
            )

        specialization = request.data.get(
            "specialization", ""
        ).strip()

        date_string = request.data.get("appointment_date")
        reason = request.data.get("reason", "").strip()

        if not all([specialization, date_string, reason]):
            return Response(
                {
                    "error": (
                        "specialization, appointment_date and reason "
                        "are required."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            appointment_date = date_class.fromisoformat(date_string)
        except (ValueError, TypeError):
            return Response(
                {"error": "Invalid date. Use YYYY-MM-DD."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if appointment_date < timezone.localdate():
            return Response(
                {"error": "Date cannot be in the past."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        matching_doctors = list(
            DoctorProfile.objects.filter(
                specialization__iexact=specialization,
                approval_status="APPROVED",
            )
        )

        if not matching_doctors:
            return Response(
                {"error": "No approved doctors found for this specialization."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Existing EmergencyRequest model requires a non-null time.
        # Store a temporary valid slot; acceptance rechecks availability.
        temporary_time = None

        for doctor in matching_doctors:
            slots = get_available_slots(doctor, appointment_date)

            if slots:
                temporary_time = datetime.strptime(
                    slots[0], "%H:%M"
                ).time()
                break

        if temporary_time is None:
            return Response(
                {
                    "error": (
                        "No available slots for this specialization "
                        "on the selected date."
                    )
                },
                status=status.HTTP_409_CONFLICT,
            )

        with transaction.atomic():
            emergency = EmergencyRequest.objects.create(
                patient=patient,
                specialization=specialization,
                appointment_date=appointment_date,
                appointment_time=temporary_time,
                reason=reason,
            )

            notifications = [
                EmergencyRequestNotification(
                    emergency_request=emergency,
                    doctor=doctor,
                )
                for doctor in matching_doctors
            ]

            EmergencyRequestNotification.objects.bulk_create(
                notifications,
                ignore_conflicts=True,
            )

        return Response(
            {
                "message": (
                    "Emergency request sent to doctors. "
                    "The accepting doctor will assign an available time."
                ),
                "emergency_request": EmergencyRequestSerializer(
                    emergency
                ).data,
                "notified_doctors": len(matching_doctors),
            },
            status=status.HTTP_201_CREATED,
        )
    
# ---------------- ACCEPT EMERGENCY REQUEST ----------------

class AcceptEmergencyRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, id):
        if request.user.role != "DOCTOR":
            raise PermissionDenied(
                "Only doctors can accept emergency requests."
            )

        try:
            doctor = DoctorProfile.objects.get(user=request.user)
        except DoctorProfile.DoesNotExist:
            return Response(
                {"error": "Doctor profile not found."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if doctor.approval_status != "APPROVED":
            return Response(
                {"error": "Doctor account is not approved."},
                status=status.HTTP_403_FORBIDDEN,
            )

        with transaction.atomic():
            try:
                notification = (
                    EmergencyRequestNotification.objects
                    .select_for_update()
                    .get(
                        emergency_request_id=id,
                        doctor=doctor,
                    )
                )
            except EmergencyRequestNotification.DoesNotExist:
                return Response(
                    {"error": "Emergency request not found."},
                    status=status.HTTP_404_NOT_FOUND,
                )

            emergency = (
                EmergencyRequest.objects
                .select_for_update()
                .get(id=notification.emergency_request_id)
            )

            if emergency.status != EmergencyRequest.Status.PENDING:
                return Response(
                    {"error": "This request has already been handled."},
                    status=status.HTTP_409_CONFLICT,
                )

            if doctor.specialization.strip().lower() != (
                emergency.specialization.strip().lower()
            ):
                return Response(
                    {"error": "Specialization does not match this request."},
                    status=status.HTTP_403_FORBIDDEN,
                )

            slots = get_available_slots(
                doctor,
                emergency.appointment_date,
            )

            if not slots:
                return Response(
                    {
                        "error": (
                            "No available slot for this doctor on the "
                            "requested date."
                        )
                    },
                    status=status.HTTP_409_CONFLICT,
                )

            appointment = None

            for slot_string in slots:
                slot_time = datetime.strptime(
                    slot_string, "%H:%M"
                ).time()

                try:
                    with transaction.atomic():
                        appointment = Appointment.objects.create(
                            doctor=doctor,
                            patient=emergency.patient,
                            appointment_date=emergency.appointment_date,
                            appointment_time=slot_time,
                            priority=Appointment.Priority.EMERGENCY,
                            reason=emergency.reason,
                            status=Appointment.Status.CONFIRMED,
                        )
                    break

                except IntegrityError:
                    continue

            if appointment is None:
                return Response(
                    {"error": "The available slot was just booked. Try again."},
                    status=status.HTTP_409_CONFLICT,
                )

            emergency.accepted_doctor = doctor
            emergency.appointment_time = appointment.appointment_time
            emergency.status = EmergencyRequest.Status.ACCEPTED

            emergency.save(
                update_fields=[
                    "accepted_doctor",
                    "appointment_time",
                    "status",
                ]
            )

        return Response(
            {
                "message": "Emergency request accepted successfully.",
                "appointment": AppointmentSerializer(appointment).data,
            },
            status=status.HTTP_201_CREATED,
        )

class AvailableDatesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != "PATIENT":
            return Response(
                {"error": "Only patients can view available dates."},
                status=status.HTTP_403_FORBIDDEN,
            )

        doctor_id = request.query_params.get("doctor_id")

        if not doctor_id:
            return Response(
                {"error": "doctor_id is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            doctor = DoctorProfile.objects.get(
                id=doctor_id,
                approval_status="APPROVED",
            )
        except (DoctorProfile.DoesNotExist, ValueError, TypeError):
            return Response(
                {"error": "Approved doctor not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        today = timezone.localdate()
        available_dates = []

        for offset in range(90):
            selected_date = today + timedelta(days=offset)

            if get_available_slots(doctor, selected_date):
                available_dates.append(selected_date.isoformat())

        return Response({
            "doctor_id": doctor.id,
            "available_dates": available_dates,
        })

class DoctorEmergencyRequestListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Check doctor role
        if request.user.role != "DOCTOR":
            return Response(
                {"error": "Only doctors can view emergency requests."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Get doctor profile
        try:
            doctor = get_doctor_profile(request.user)
        except Exception:
            return Response(
                {"error": "Doctor profile not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check doctor approval
        if doctor.approval_status != "APPROVED":
            return Response(
                {"error": "Your account is not approved."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Fetch pending emergency notifications for this doctor
        notifications = (
            EmergencyRequestNotification.objects
            .filter(
                doctor=doctor,
                emergency_request__status="PENDING"
            )
            .select_related(
                "emergency_request",
                "emergency_request__patient",
                "emergency_request__patient__user"
            )
            .order_by("-created_at")
        )

        data = []

        # Build response data for each notification
        for notification in notifications:
            emergency = notification.emergency_request
            patient = emergency.patient
            user = patient.user

            date_of_birth = getattr(
                patient,
                "date_of_birth",
                None
            )

            age = None

            # Calculate patient age if date_of_birth exists
            if date_of_birth:
                today = timezone.localdate()

                age = (
                    today.year - date_of_birth.year
                    - (
                        (today.month, today.day)
                        < (date_of_birth.month, date_of_birth.day)
                    )
                )

            # IMPORTANT: append must be inside the loop
            data.append({
                "notification_id": notification.id,
                "emergency_id": emergency.id,
                "patient_id": patient.id,
                "patient_name": (
                    user.get_full_name() or user.username
                ),
                "phone": getattr(user, "phone_number", None),
                "email": getattr(user, "email", None),
                "age": age,
                "gender": getattr(patient, "gender", None),
                "address": getattr(patient, "address", None),
                "specialization": emergency.specialization,
                "appointment_date": emergency.appointment_date,
                "appointment_time": emergency.appointment_time,
                "reason": emergency.reason,
                "status": emergency.status,
                "created_at": notification.created_at,
            })

        return Response(
            data,
            status=status.HTTP_200_OK
        )

class DoctorAppointmentActionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, id, action):

        # 1. Doctor permission check
        if request.user.role != "DOCTOR":
            return Response(
                {"error": "Only doctors can manage appointments."},
                status=status.HTTP_403_FORBIDDEN
            )

        # 2. Get doctor profile
        try:
            doctor = get_doctor_profile(request.user)
        except Exception:
            return Response(
                {"error": "Doctor profile not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        # 3. Get appointment belonging to this doctor
        try:
            appointment = Appointment.objects.get(
                id=id,
                doctor=doctor
            )
        except Appointment.DoesNotExist:
            return Response(
                {"error": "Appointment not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        # 4. Accept appointment
        if action == "accept":

            if appointment.status != "PENDING":
                return Response(
                    {"error": "Only pending appointments can be accepted."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            appointment.status = "CONFIRMED"
            message = "Appointment accepted successfully."

        # 5. Reject appointment
        elif action == "reject":

            if appointment.status != "PENDING":
                return Response(
                    {"error": "Only pending appointments can be rejected."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            appointment.status = "CANCELLED"
            message = "Appointment rejected successfully."

        # 6. Complete appointment
        elif action == "complete":

            if appointment.status != "CONFIRMED":
                return Response(
                    {
                        "error": (
                            "Only confirmed appointments can be completed."
                        ),
                        "current_status": appointment.status
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            appointment.status = "COMPLETED"
            message = "Appointment completed successfully."

        # 7. Invalid action
        else:
            return Response(
                {"error": "Invalid action."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 8. Save changes
        appointment.save(update_fields=["status", "updated_at"])

        # 9. Response
        return Response(
            {
                "message": message,
                "appointment_id": appointment.id,
                "status": appointment.status
            },
            status=status.HTTP_200_OK
        )

class DoctorConsultationView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, appointment_id):
        if getattr(request.user, "role", None) != "DOCTOR":
            return Response(
                {"success": False, "message": "Doctor access only."},
                status=status.HTTP_403_FORBIDDEN
            )

        doctor = get_object_or_404(
            DoctorProfile,
            user=request.user
        )

        appointment = get_object_or_404(
            Appointment.objects.select_for_update(),
            id=appointment_id,
            doctor=doctor
        )

        if appointment.status == Appointment.Status.COMPLETED:
            return Response(
                {
                    "success": False,
                    "message": "This appointment is already completed."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if appointment.status != Appointment.Status.CONFIRMED:
            return Response(
                {
                    "success": False,
                    "message": "Only confirmed appointments can be completed."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate required diagnosis before saving
        diagnosis = str(
            request.data.get("diagnosis", "")
        ).strip()

        if not diagnosis:
            return Response(
                {
                    "success": False,
                    "message": "Diagnosis is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        doctor_user = getattr(doctor, "user", None)
        doctor_name = str(doctor)

        if doctor_user:
            doctor_name = (
                doctor_user.get_full_name()
                or doctor_user.username
            )

        specialization = getattr(
            doctor,
            "specialization",
            ""
        )

        # One medical record per appointment
        record, created = MedicalHistory.objects.get_or_create(
            appointment=appointment,
            defaults={
                "patient": appointment.patient,
                "doctor_name": doctor_name,
                "specialization": str(specialization or ""),
                "consultation_date": appointment.appointment_date,
                "symptoms": appointment.reason,
                "diagnosis": diagnosis,
                "treatment": request.data.get("treatment", ""),
                "prescription": request.data.get("prescription", ""),
                "test_results": request.data.get("test_results", ""),
                "allergies": request.data.get("allergies", ""),
                "notes": request.data.get("notes", ""),
            }
        )

        if not created:
            return Response(
                {
                    "success": False,
                    "message": "A medical record already exists for this appointment."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Complete only after record creation succeeds
        appointment.status = Appointment.Status.COMPLETED
        appointment.save(update_fields=["status", "updated_at"])

        return Response(
            {
                "success": True,
                "message": "Consultation saved and appointment completed.",
                "data": MedicalHistorySerializer(record).data
            },
            status=status.HTTP_201_CREATED
        )

# ==========================================
# ADMIN - VIEW ALL PATIENTS
# ==========================================

class AdminPatientListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Admin mattum access panna mudiyum
        if getattr(request.user, "role", None) != "ADMIN":
            raise PermissionDenied("Only admins can view all patients.")

        patients = PatientProfile.objects.select_related(
            "user"
        ).order_by("id")

        data = []

        for patient in patients:
            user = patient.user

            data.append({
                "id": patient.id,
                "user_id": user.id,
                "name": user.get_full_name() or user.username,
                "username": user.username,
                "email": user.email,
                "phone_number": getattr(user, "phone_number", ""),
            })

        return Response(data, status=status.HTTP_200_OK)


# ==========================================
# ADMIN - VIEW SELECTED PATIENT APPOINTMENTS
# ==========================================

class AdminPatientAppointmentsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, patient_id):
        # Admin mattum access panna mudiyum
        if getattr(request.user, "role", None) != "ADMIN":
            raise PermissionDenied(
                "Only admins can view patient appointment history."
            )

        try:
            patient = PatientProfile.objects.select_related(
                "user"
            ).get(id=patient_id)

        except PatientProfile.DoesNotExist:
            return Response(
                {"detail": "Patient not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        appointments = Appointment.objects.filter(
            patient=patient
        ).select_related(
            "doctor__user",
            "patient__user"
        ).order_by(
            "-appointment_date",
            "-appointment_time"
        )

        appointment_data = AppointmentSerializer(
            appointments,
            many=True
        ).data

        return Response({
            "patient": {
                "id": patient.id,
                "user_id": patient.user.id,
                "name": (
                    patient.user.get_full_name()
                    or patient.user.username
                ),
                "email": patient.user.email,
                "phone_number": getattr(
                    patient.user, "phone_number", ""
                ),
            },

            "total_appointments": appointments.count(),

            "pending_count": appointments.filter(
                status=Appointment.Status.PENDING
            ).count(),

            "confirmed_count": appointments.filter(
                status=Appointment.Status.CONFIRMED
            ).count(),

            "completed_count": appointments.filter(
                status=Appointment.Status.COMPLETED
            ).count(),

            "cancelled_count": appointments.filter(
                status=Appointment.Status.CANCELLED
            ).count(),

            "rescheduled_count": appointments.filter(
                status=Appointment.Status.RESCHEDULED
            ).count(),

            "appointments": appointment_data,
        }, status=status.HTTP_200_OK)


class AdminDoctorListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Admin role check
        if request.user.role != "ADMIN":
            return Response(
                {"detail": "Only admin can view doctors."},
                status=status.HTTP_403_FORBIDDEN
            )

        doctors = DoctorProfile.objects.select_related(
            "user"
        ).all().order_by("-id")

        serializer = AdminDoctorSerializer(
            doctors,
            many=True,
            context={"request": request}
        )

        return Response(
            {
                "success": True,
                "count": doctors.count(),
                "doctors": serializer.data,
            },
            status=status.HTTP_200_OK
        )

class AdminDoctorAppointmentsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, doctor_id):
        # Allow admin only
        if getattr(request.user, "role", None) != "ADMIN":
            return Response(
                {"detail": "Only admin can view doctor appointments."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            doctor = DoctorProfile.objects.get(user_id=doctor_id)
        except DoctorProfile.DoesNotExist:
            return Response(
                {"detail": "Doctor not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        appointments = Appointment.objects.filter(
            doctor=doctor
        ).select_related(
            "doctor",
            "patient",
            "patient__user",
        ).order_by("-appointment_date", "-appointment_time")

        serializer = AppointmentSerializer(
            appointments,
            many=True,
            context={"request": request},
        )

        return Response({
            "success": True,
            "count": appointments.count(),
            "appointments": serializer.data,
        }, status=status.HTTP_200_OK)

# appointments/views.py
class AdminDoctorApprovalView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, doctor_id, action):
        if getattr(request.user, "role", "").upper() != "ADMIN":
            return Response(
                {"message": "Admin access only."},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            doctor = DoctorProfile.objects.get(user_id=doctor_id)
        except DoctorProfile.DoesNotExist:
            return Response(
                {"message": "Doctor not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        if doctor.approval_status != "PENDING":
            return Response(
                {"message": "This request has already been processed."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if action == "approve":
            doctor.approval_status = "APPROVED"
        elif action == "reject":
            doctor.approval_status = "REJECTED"
        else:
            return Response(
                {"message": "Invalid action."},
                status=status.HTTP_400_BAD_REQUEST
            )

        doctor.save(update_fields=["approval_status"])

        return Response({
            "success": True,
            "message": f"Doctor request {action}d successfully.",
            "approval_status": doctor.approval_status
        })


class AdminProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        if user.role != "ADMIN":
            return Response(
                {"message": "Admin access only."},
                status=status.HTTP_403_FORBIDDEN
            )

        return Response({
            "id": user.id,
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "phone_number": getattr(user, "phone_number", ""),
            "role": user.role,
        })

    def patch(self, request):
        user = request.user

        if user.role != "ADMIN":
            return Response(
                {"message": "Admin access only."},
                status=status.HTTP_403_FORBIDDEN
            )

        allowed_fields = [
            "first_name",
            "last_name",
            "email",
            "phone_number",
        ]

        for field in allowed_fields:
            if field in request.data:
                value = request.data[field]

                if field == "email" and not value:
                    return Response(
                        {"message": "Email is required."},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                setattr(user, field, value)

        user.save()

        return Response({
            "message": "Profile updated successfully.",
            "profile": {
                "id": user.id,
                "username": user.username,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "email": user.email,
                "phone_number": getattr(user, "phone_number", ""),
                "role": user.role,
            }
        })


class AdminChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user

        if user.role != "ADMIN":
            return Response(
                {"message": "Admin access only."},
                status=status.HTTP_403_FORBIDDEN
            )

        old_password = request.data.get("old_password", "")
        new_password = request.data.get("new_password", "")

        if not user.check_password(old_password):
            return Response(
                {"message": "Current password is incorrect."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if len(new_password) < 8:
            return Response(
                {"message": "Password must contain at least 8 characters."},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(new_password)
        user.save()

        update_session_auth_hash(request, user)

        return Response({
            "message": "Password changed successfully."
        })
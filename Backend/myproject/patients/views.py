from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny,IsAuthenticated
from django.contrib.auth import get_user_model
from appointments.models import Appointment

from .serializers import (
    PatientRegistrationSerializer,
    PatientListSerializer,
    MedicalHistorySerializer,
    
)
from .models import PatientProfile, MedicalHistory

User = get_user_model()


class PatientRegistrationView(APIView):

    permission_classes = [AllowAny]

    def get(self, request):

        patients = User.objects.filter(role="PATIENT").select_related("patient_profile")

        serializer = PatientListSerializer(
            patients,
            many=True
        )

        return Response({
            "success": True,
            "data": serializer.data
        }, status=status.HTTP_200_OK)

    def post(self, request):

        serializer = PatientRegistrationSerializer(data=request.data)

        if serializer.is_valid():

            user = serializer.save()

            return Response({
                "success": True,
                "message": "Patient registered successfully",
                "user_id": user.id,
                "role": user.role
            }, status=status.HTTP_201_CREATED)

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )



class PatientMyProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        if getattr(user, "role", None) != "PATIENT":
            return Response(
                {
                    "success": False,
                    "message": "Only patients can access this profile."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            # Get only the logged-in patient's own profile
            user = User.objects.select_related(
                "patient_profile"
            ).get(id=request.user.id)

            serializer = PatientListSerializer(
                user,
                context={"request": request}
            )

            return Response(
                {
                    "success": True,
                    "data": serializer.data
                },
                status=status.HTTP_200_OK
            )

        except User.DoesNotExist:
            return Response(
                {"success": False, "message": "Patient not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        except Exception as error:
            print("Patient profile error:", str(error))
            return Response(
                {
                    "success": False,
                    "message": "Unable to load patient profile."
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class PatientMedicalHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if getattr(request.user, "role", None) != "PATIENT":
            return Response(
                {
                    "success": False,
                    "message": "Only patients can access medical history."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            patient = PatientProfile.objects.get(user=request.user)

            # Completed appointments for the logged-in patient only
            appointments = Appointment.objects.filter(
                patient=patient,
                status=Appointment.Status.COMPLETED
            ).select_related(
                "doctor",
                "doctor__user"
            ).order_by(
                "-appointment_date",
                "-appointment_time"
            )

            # Existing manually saved medical records
            medical_records = MedicalHistory.objects.filter(
                patient=patient
            )

            data = []

            # Convert completed appointments into history entries
            for appointment in appointments:
                doctor = appointment.doctor

                doctor_user = getattr(doctor, "user", None)

                doctor_name = (
                    doctor_user.get_full_name()
                    if doctor_user and doctor_user.get_full_name()
                    else str(doctor)
                )

                specialization = getattr(
                    doctor,
                    "specialization",
                    ""
                )

                data.append({
                    "id": f"appointment-{appointment.id}",
                    "source": "appointment",
                    "doctor_name": doctor_name,
                    "specialization": str(specialization or ""),
                    "consultation_date": str(
                        appointment.appointment_date
                    ),
                    "symptoms": appointment.reason or "",
                    "diagnosis": "",
                    "treatment": "",
                    "prescription": "",
                    "test_results": "",
                    "allergies": "",
                    "notes": "Completed appointment",
                    "created_at": appointment.updated_at.isoformat(),
                })

            # Add manually saved medical history records
            serializer = MedicalHistorySerializer(
                medical_records,
                many=True
            )

            for record in serializer.data:
                record["source"] = "medical_record"
                data.append(record)

            # Sort latest consultations first
            data.sort(
                key=lambda item: (
                    item.get("consultation_date") or "",
                    item.get("created_at") or ""
                ),
                reverse=True
            )

            return Response({
                "success": True,
                "count": len(data),
                "data": data
            }, status=status.HTTP_200_OK)

        except PatientProfile.DoesNotExist:
            return Response({
                "success": False,
                "message": "Patient profile not found."
            }, status=status.HTTP_404_NOT_FOUND)
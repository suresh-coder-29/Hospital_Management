from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny,IsAuthenticated

from .models import DoctorProfile
from .serializers import DoctorRegistrationSerializer,DoctorMyProfileSerializer


class DoctorRegistrationView(APIView):

    permission_classes = [AllowAny]

    def get(self, request):

        doctors = DoctorRegistrationSerializer(
            # Add your doctor queryset here
        )

        return Response({
            "success": True,
            "data": doctors.data
        }, status=status.HTTP_200_OK)


    def post(self, request):

        serializer = DoctorRegistrationSerializer(data=request.data)

        if serializer.is_valid():

            user = serializer.save()

            return Response({
                "success": True,
                "message": "Doctor registration submitted. Waiting for admin approval.",
                "user_id": user.id,
                "role": user.role,
                "approval_status": user.doctor_profile.approval_status
            }, status=status.HTTP_201_CREATED)

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


class DoctorMyProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != "DOCTOR":
            return Response(
                {"error": "Only doctors can view this profile."},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            doctor = DoctorProfile.objects.select_related(
                "user"
            ).get(user=request.user)

        except DoctorProfile.DoesNotExist:
            return Response(
                {"error": "Doctor profile not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = DoctorMyProfileSerializer(
            doctor,
            context={"request": request}
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )
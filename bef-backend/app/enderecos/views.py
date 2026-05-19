from django.contrib.auth import get_user_model
from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import Cliente
from .serializers import (
    LoginSerializer,
    RegisterAuthSerializer,
    RegisterBasicsSerializer,
    RegisterLocationSerializer,
)


class LoginView(TokenObtainPairView):
    permission_classes = (AllowAny,)
    serializer_class = LoginSerializer


class RegisterBasicsView(generics.CreateAPIView):
    queryset = Cliente.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterBasicsSerializer

    def post(self, request, *args, **kwargs):
        serializer = RegisterBasicsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        cliente = serializer.save()

        return Response(cliente.id, status=status.HTTP_201_CREATED)


class RegisterLocationView(generics.CreateAPIView):
    queryset = Cliente.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterLocationSerializer


class RegisterAuthView(generics.CreateAPIView):
    queryset = get_user_model().objects.filter(is_active=True)
    permission_classes = (AllowAny,)
    serializer_class = RegisterAuthSerializer

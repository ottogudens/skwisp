from django.contrib.auth import authenticate
from django_ratelimit.decorators import ratelimit
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status


@api_view(['POST'])
@permission_classes([AllowAny])
# Limita intentos de login por IP: 10 intentos/min. Sin esto, el endpoint quedaba
# abierto a fuerza bruta de usuario/contraseña sin ningún límite.
@ratelimit(key='ip', rate='10/m', method='POST', block=True)
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')
    user = authenticate(request, username=username, password=password)

    if user is None:
        return Response({'detail': 'Credenciales inválidas'}, status=status.HTTP_401_UNAUTHORIZED)

    token, _ = Token.objects.get_or_create(user=user)
    return Response({
        'token': token.key,
        'user': {'id': user.id, 'username': user.username, 'is_staff': user.is_staff},
    })

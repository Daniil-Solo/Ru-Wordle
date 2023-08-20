import functools
from django.db import transaction
from django.http import JsonResponse

from .exceptions import NoGameException, NoCacheConnectionException


def handle_cache_error(f):
    """
    Декоратор для отлавливания ошибки подключения к кэшу
    """
    @functools.wraps(f)
    def inner(request, *args, **kwargs):
        try:
            with transaction.atomic():
                return f(request, *args, **kwargs)
        except NoCacheConnectionException:
            return JsonResponse({"message": "Сервис временно недоступен!"}, status=503)
    return inner


def handle_game_error(f):
    """
    Декоратор для отлавливания ошибки извлечения идентификатора игры из кукки и ошибки несуществующей игры
    """
    @functools.wraps(f)
    def inner(request, *args, **kwargs):
        try:
            with transaction.atomic():
                return f(request, *args, **kwargs)
        except (NoGameException, KeyError):
            return JsonResponse({"message": "Игры не существует!"}, status=400)
    return inner

from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.cache import never_cache

from .services import GameService
from .exceptions import NoGameException, NoCacheConnectionException
from backend.settings import MAX_GAME_TIME


@csrf_exempt
@require_http_methods(["POST"])
def start_new_game(request):
    try:
        game = GameService.create_new_game()
    except NoCacheConnectionException:
        return JsonResponse({"message": "Сервис временно недоступен!"}, status=503)
    response = JsonResponse({"message": "Игра создана"}, status=201)
    response.set_cookie("game_id", game.id, max_age=MAX_GAME_TIME, httponly=True)
    return response


@never_cache
def check_word(request):
    try:
        word = request.GET["word"]
    except KeyError:
        return JsonResponse({"message": "Не отправлено слово!"}, status=400)

    try:
        game_id = request.COOKIES["game_id"]
    except KeyError:
        return JsonResponse({"message": "Игры не существует или она уже закончилась!"}, status=400)

    try:
        success, is_last_attempt, letters_with_status, right_answer = GameService.check_word(game_id, word)
    except NoGameException:
        response = JsonResponse({"message": "Игры не существует или она уже закончилась!"}, status=400)
        response.delete_cookie("game_id")
        return response
    except NoCacheConnectionException:
        return JsonResponse({"message": "Сервис временно недоступен!"}, status=503)
    if success:
        GameService.set_victory_status(game_id)
        response = JsonResponse({"message": "Победа!", "letters": letters_with_status, "game_status": "victory"})
        response.delete_cookie("game_id")
    elif is_last_attempt:
        GameService.set_attempt_ended_status(game_id)
        response = JsonResponse({
            "message": "Проигрыш!", "letters": letters_with_status,
            "right_answer": right_answer, "game_status": "loss"
        })
        response.delete_cookie("game_id")
    else:
        response = JsonResponse({
            "message": "Задумано другое слово!", "letters": letters_with_status,
            "game_status": "continues"
        })
    return response


@never_cache
def get_word_after_ending_game(request):
    try:
        game_id = request.COOKIES["game_id"]
        right_answer = GameService.get_right_answer(game_id)
    except (KeyError, NoGameException):
        return JsonResponse({"message": "Игры не существует!"}, status=400)

    response = JsonResponse({
        "message": f"Правильное слово было {right_answer}"
    })
    response.delete_cookie("game_id")
    return response


def home_page(request):
    return render(request, "words/index.html")
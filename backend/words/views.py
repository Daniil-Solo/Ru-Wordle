from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.cache import never_cache

from .services import GameService
from .exceptions import NoGameException, NoCacheConnectionException
from .utils import handle_cache_error, handle_game_error
from backend.settings import MAX_GAME_TIME


@handle_cache_error
@csrf_exempt
@require_http_methods(["POST"])
def start_new_game(request):
    game = GameService.create_new_game()
    response = JsonResponse({"message": "Игра создана"}, status=201)
    response.set_cookie("game_id", game.id, max_age=MAX_GAME_TIME, httponly=True)
    return response


@handle_game_error
@handle_cache_error
@never_cache
def check_word(request):
    try:
        word = request.GET["word"]
    except KeyError:
        return JsonResponse({"message": "Не отправлено слово!"}, status=400)

    game_id = request.COOKIES["game_id"]
    success, is_last_attempt, letters_with_status, right_answer = GameService.check_word(game_id, word)
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


@handle_game_error
@never_cache
def get_word_after_ending_game(request):
    game_id = request.COOKIES["game_id"]
    right_answer = GameService.get_right_answer(game_id)
    response = JsonResponse({
        "message": f"Правильное слово было {right_answer}"
    })
    response.delete_cookie("game_id")
    return response


def home_page(request):
    return render(request, "words/index.html")
from django.http import JsonResponse
from django.shortcuts import render

from .services import GameService
from .exceptions import NoGameException
from backend.settings import MAX_GAME_TIME


def start_new_game(request):
    game = GameService.create_new_game()
    response = JsonResponse({"message": "Игра создана"}, status=201)
    response.set_cookie("game_id", game.id, max_age=MAX_GAME_TIME, httponly=True)
    return response


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
        response.delete_cookie(game_id)
        return response

    if success:
        GameService.set_victory_status(game_id)
        response = JsonResponse({"message": "Победа!"})
        response.delete_cookie(game_id)
    elif is_last_attempt:
        response = JsonResponse({"message": "Проигрыш!", "letters": letters_with_status, "right_answer": right_answer})
        response.delete_cookie(game_id)
    else:
        response = JsonResponse({"message": "Задумано другое слово!", "letters": letters_with_status})
    return response


def home_page(request):
    return render(request, "words/index.html")
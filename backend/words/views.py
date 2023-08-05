from django.http import JsonResponse
from .services import GameService
from backend.settings import MAX_GAME_TIME


def start_new_game(request):
    game = GameService.create_new_game()
    response = JsonResponse({"status": "ok", "message": "Игра создана"})
    response.set_cookie("game_id", game.id, max_age=MAX_GAME_TIME, httponly=True)
    return response


def check_word(request):
    try:
        word = request.GET["word"]
    except KeyError:
        return JsonResponse({"status": "error", "message": "Не отправлено слово!"})
    try:
        game_id = request.COOKIES["game_id"]
        success = GameService.check_word(game_id, word)
        if success:
            GameService.set_victory_status(game_id)
            response = JsonResponse({"status": "ok", "message": "Победа!"})
        else:
            response = JsonResponse({"status": "error", "message": "Задумано другое слово!"})
        return response
    except KeyError:
        return JsonResponse({"status": "error", "message": "Игры не существует или она уже закончилась!"})


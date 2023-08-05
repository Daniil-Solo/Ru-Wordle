import redis

from .models import Word, Game
from backend.settings import REDIS_HOST, REDIS_PORT, MAX_GAME_TIME, MAX_GAME_ATTEMPT_COUNT


redis_storage = redis.StrictRedis(host=REDIS_HOST, port=REDIS_PORT, db=0)


class GameService:
    @staticmethod
    def create_new_game() -> Game:
        word = Word.get_random()
        game = Game(word=word)
        game.save()
        game_id = str(game.id)
        redis_storage.set(game_id, word.name, ex=MAX_GAME_TIME)
        return game

    @staticmethod
    def set_victory_status(game_id: str) -> None:
        game = Game.objects.get(id=game_id)
        game.status = Game.Status.VICTORY
        game.save()

    @staticmethod
    def check_word(game_id: str, word: str) -> bool:
        cached_word = redis_storage.get(game_id).decode()
        print(cached_word, word)
        return cached_word == word

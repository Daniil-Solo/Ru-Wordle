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
        redis_storage.delete(game_id)

    @staticmethod
    def check_word(game_id: str, word: str) -> tuple[bool, list[dict[str: str]]]:
        cached_word = redis_storage.get(game_id).decode()
        letters_with_status = GameService.get_letters_with_status(cached_word, word)
        return cached_word == word, letters_with_status

    @staticmethod
    def get_letters_with_status(true_word, possible_word) -> list[dict[str: str]]:
        letters = []
        for (idx, letter) in enumerate(possible_word):
            letter_data = dict(letter=letter, color="disabled")
            if letter in true_word and letter == true_word[idx]:
                letter_data["color"] = "success"
            elif letter in true_word and letter != true_word[idx] \
                    and possible_word[:idx+1].count(letter) <= true_word.count(letter):
                letter_data["color"] = "active"
            letters.append(letter_data)
        return letters

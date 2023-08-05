import redis

from .models import Word, Game
from .exceptions import NoGameException
from backend.settings import REDIS_HOST, REDIS_PORT, MAX_GAME_TIME, MAX_GAME_ATTEMPT_COUNT


redis_storage = redis.StrictRedis(host=REDIS_HOST, port=REDIS_PORT, db=0)


class CacheService:
    @staticmethod
    def add_new_game(game_id: str, word: str) -> None:
        redis_storage.set(game_id, word, ex=MAX_GAME_TIME)
        attempt_count_key = game_id + "_cnt"
        redis_storage.set(attempt_count_key, 0, ex=MAX_GAME_TIME)

    @staticmethod
    def delete_game(game_id: str) -> None:
        redis_storage.delete(game_id)
        attempt_count_key = game_id + "_cnt"
        redis_storage.delete(attempt_count_key)

    @staticmethod
    def get_current_attempt(game_id: str) -> int:
        attempt_count_key = game_id + "_cnt"
        previous_attempt_number = redis_storage.get(attempt_count_key)
        if previous_attempt_number is None:
            raise NoGameException
        previous_attempt_number = int(previous_attempt_number.decode())
        current_attempt_number = previous_attempt_number + 1
        return current_attempt_number

    @staticmethod
    def increase_attempt_count(game_id: str) -> None:
        attempt_count_key = game_id + "_cnt"
        redis_storage.incrby(attempt_count_key, 1)

    @staticmethod
    def get_word(game_id: str) -> str:
        return redis_storage.get(game_id).decode()


class GameService:
    @staticmethod
    def create_new_game() -> Game:
        word = Word.get_random()
        game = Game(word=word)
        game.save()
        CacheService.add_new_game(str(game.id), word.name)
        return game

    @staticmethod
    def set_victory_status(game_id: str) -> None:
        game = Game.objects.get(id=game_id)
        game.status = Game.Status.VICTORY
        game.save()
        CacheService.delete_game(game_id)

    @staticmethod
    def check_word(game_id: str, word: str) -> tuple[bool, bool, list[dict[str: str]], str]:
        current_attempt_number = CacheService.get_current_attempt(game_id)
        CacheService.increase_attempt_count(game_id)
        cached_word = CacheService.get_word(game_id)
        letters_with_status = GameService.get_letters_with_status(cached_word, word)
        is_last_attempt = current_attempt_number == MAX_GAME_ATTEMPT_COUNT
        if is_last_attempt:
            CacheService.delete_game(game_id)
        return cached_word == word, is_last_attempt, letters_with_status, cached_word

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

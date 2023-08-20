import redis
from django.core.exceptions import ObjectDoesNotExist

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
    def set_attempt_ended_status(game_id: str) -> None:
        game = Game.objects.get(id=game_id)
        game.status = Game.Status.ATTEMPT_ENDED
        game.save()
        CacheService.delete_game(game_id)

    @staticmethod
    def get_right_answer(game_id: str) -> str:
        try:
            game = Game.objects.get(id=game_id)
        except ObjectDoesNotExist:
            raise NoGameException
        if game.status == Game.Status.IN_PROCESS:
            game.status = Game.Status.TIME_OVER
            game.save()
        return game.word

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
        possible_active_letter_positions = []
        for (idx, letter) in enumerate(possible_word):
            letter_data = dict(letter=letter, color="disabled")
            if letter in true_word and letter == true_word[idx]:
                letter_data["color"] = "success"
            elif letter in true_word and letter != true_word[idx]:
                possible_active_letter_positions.append(idx)
            letters.append(letter_data)
        for position in possible_active_letter_positions:
            letter = letters[position]["letter"]
            n_letters_in_true_word = true_word.count(letter)
            n_busy_letters_in_possible_word = len([
                item for item in letters
                if item["letter"] == letter and item["color"] in ("success", "active")
            ])
            if n_busy_letters_in_possible_word < n_letters_in_true_word:
                letters[position]["color"] = "active"
        return letters

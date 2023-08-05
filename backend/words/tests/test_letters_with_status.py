from django.test import SimpleTestCase
from words.services import GameService


class GameServiceTestCase(SimpleTestCase):
    def test_same_words(self):
        true_word = "мираж"
        possible_word = "мираж"
        letters = GameService.get_letters_with_status(true_word, possible_word)
        right_letters = [
            dict(letter="м", color="success"),
            dict(letter="и", color="success"),
            dict(letter="р", color="success"),
            dict(letter="а", color="success"),
            dict(letter="ж", color="success"),
        ]
        self.assertListEqual(letters, right_letters)

    def test_same_letters_different_order(self):
        true_word = "кобра"
        possible_word = "брако"
        letters = GameService.get_letters_with_status(true_word, possible_word)
        right_letters = [
            dict(letter="б", color="active"),
            dict(letter="р", color="active"),
            dict(letter="а", color="active"),
            dict(letter="к", color="active"),
            dict(letter="о", color="active"),
        ]
        self.assertListEqual(letters, right_letters)

    def test_almost_same_letters_same_order(self):
        true_word = "кобра"
        possible_word = "кобол"
        letters = GameService.get_letters_with_status(true_word, possible_word)
        right_letters = [
            dict(letter="к", color="success"),
            dict(letter="о", color="success"),
            dict(letter="б", color="success"),
            dict(letter="о", color="disabled"),
            dict(letter="л", color="disabled"),
        ]
        self.assertListEqual(letters, right_letters)

    def test_almost_same_letters_different_order_1(self):
        true_word = "ооорг"
        possible_word = "шнооо"
        letters = GameService.get_letters_with_status(true_word, possible_word)
        right_letters = [
            dict(letter="ш", color="disabled"),
            dict(letter="н", color="disabled"),
            dict(letter="о", color="success"),
            dict(letter="о", color="active"),
            dict(letter="о", color="active"),
        ]
        self.assertListEqual(letters, right_letters)

    def test_almost_same_letters_different_order_2(self):
        true_word = "огорг"
        possible_word = "оомоо"
        letters = GameService.get_letters_with_status(true_word, possible_word)
        right_letters = [
            dict(letter="о", color="success"),
            dict(letter="о", color="active"),
            dict(letter="м", color="disabled"),
            dict(letter="о", color="disabled"),
            dict(letter="о", color="disabled"),
        ]
        self.assertListEqual(letters, right_letters)

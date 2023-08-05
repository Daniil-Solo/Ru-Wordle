import uuid
from django.db import models


class Word(models.Model):
    class DifficultyLevel(models.TextChoices):
        EASY = "e", "Легкий"
        MEDIUM = "m", "Средний"
        HARD = "h", "Сложный"

    name = models.CharField(max_length=5, unique=True, verbose_name="Название")
    difficulty = models.CharField(
        max_length=1, choices=DifficultyLevel.choices, default=DifficultyLevel.EASY,
        verbose_name="Сложность"
    )

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Слово"
        verbose_name_plural = "Слова"
        ordering = ("name", )


class Game(models.Model):
    class Status(models.TextChoices):
        IN_PROCESS = "ip", "В процессе"
        TIME_OVER = "to", "Время закончилось"
        ATTEMPT_ENDED = "ae", "Попытки закончились"
        VICTORY = "vy", "Победа"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    word = models.ForeignKey(
        to=Word, on_delete=models.CASCADE, related_name="games",
        verbose_name="Слово",
        editable=False
    )
    start_date = models.DateTimeField(auto_now_add=True, verbose_name="Дата начала игры")
    status = models.CharField(
        max_length=2, choices=Status.choices, default=Status.IN_PROCESS,
        verbose_name="Статус"
    )

    def __str__(self):
        return f"Игра {self.id}"

    class Meta:
        verbose_name = "Игра"
        verbose_name_plural = "Игры"
        ordering = ("start_date", )

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
        return {self.name}

    class Meta:
        verbose_name = "Слово"
        verbose_name_plural = "Слова"

from django.contrib import admin
from .models import Word, Game


@admin.register(Word)
class WordAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "difficulty")
    search_fields = ("name",)
    list_filter = ("difficulty",)
    ordering = ("name",)


@admin.register(Game)
class GameAdmin(admin.ModelAdmin):
    list_display = ("id", "status", "start_date", "word_name")
    readonly_fields = ("start_date", "word_name", "word_difficulty")
    search_fields = ("word__name",)
    list_filter = ("status", "word__difficulty")
    ordering = ("start_date",)

    @admin.display(description="Слово")
    def word_name(self, obj):
        return obj.word.name

    @admin.display(description="Сложность")
    def word_difficulty(self, obj):
        word_difficulty_name = obj.word.difficulty
        word_difficulty_label = None
        for (name, label) in Word.DifficultyLevel.choices:
            if word_difficulty_name == name:
                word_difficulty_label = label
        return word_difficulty_label

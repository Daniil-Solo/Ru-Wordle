from django.contrib import admin
from django.urls import path
import words.views as word_views


urlpatterns = [
    path('admin/', admin.site.urls),
    path('start_new_game/', word_views.start_new_game),
    path('check_word/', word_views.check_word),
]

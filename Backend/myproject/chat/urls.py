
from django.urls import path
from .views import (
    ChatConversationListView,
    ChatMessagesView,
)

urlpatterns = [
    path(
        "conversations/",
        ChatConversationListView.as_view(),
        name="chat-conversations",
    ),
    path(
        "conversations/<int:appointment_id>/messages/",
        ChatMessagesView.as_view(),
        name="chat-messages",
    ),
]

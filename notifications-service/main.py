from fastapi import FastAPI
from pydantic import BaseModel
from datetime import datetime, timezone
import itertools

app = FastAPI(title="Notifications Service")

_notifications: dict[int, list[dict]] = {}
_id_seq = itertools.count(1)


class NotificationIn(BaseModel):
    userId: int
    message: str


@app.get("/health")
def health():
    return {"status": "UP", "service": "notifications-service"}


@app.post("/api/notifications")
def create_notification(payload: NotificationIn):
    note = {
        "id": next(_id_seq),
        "userId": payload.userId,
        "message": payload.message,
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "read": False,
    }
    _notifications.setdefault(payload.userId, []).append(note)
    return note


@app.get("/api/notifications/{user_id}")
def list_notifications(user_id: int):
    return _notifications.get(user_id, [])


@app.put("/api/notifications/{user_id}/{note_id}/read")
def mark_read(user_id: int, note_id: int):
    for n in _notifications.get(user_id, []):
        if n["id"] == note_id:
            n["read"] = True
            return n
    return {"error": "notification not found"}
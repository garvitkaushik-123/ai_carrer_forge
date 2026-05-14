import uuid

_sessions: dict[str, dict] = {}


def create_session() -> str:
    session_id = uuid.uuid4().hex[:12]
    _sessions[session_id] = {}
    return session_id


def get_session(session_id: str) -> dict | None:
    return _sessions.get(session_id)


def update_session(session_id: str, data: dict) -> None:
    if session_id in _sessions:
        _sessions[session_id].update(data)

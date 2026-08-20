from pymongo import ASCENDING, DESCENDING, MongoClient
from pymongo.errors import PyMongoError

from backend.config.settings import get_settings


class Database:
    def __init__(self) -> None:
        self.client: MongoClient | None = None
        self.db = None
        self.connected = False

    def connect(self) -> None:
        settings = get_settings()
        try:
            self.client = MongoClient(settings.mongodb_uri, serverSelectionTimeoutMS=3000)
            self.client.admin.command("ping")
            self.db = self.client[settings.database_name]
            self.connected = True
            self._create_indexes()
        except PyMongoError:
            self.client = None
            self.db = None
            self.connected = False

    def close(self) -> None:
        if self.client:
            self.client.close()
        self.client = None
        self.db = None
        self.connected = False

    def require_db(self):
        if not self.connected or self.db is None:
            raise RuntimeError("Database unavailable")
        return self.db

    def _create_indexes(self) -> None:
        db = self.require_db()
        db.users.create_index("email", unique=True)
        db.exercises.create_index([("active", ASCENDING), ("domain", ASCENDING), ("difficulty", ASCENDING)])
        db.attempts.create_index([("user_id", ASCENDING), ("created_at", DESCENDING)])
        db.attempts.create_index("exercise_id")
        db.progress.create_index("user_id", unique=True)
        db.sessions.create_index([("user_id", ASCENDING), ("started_at", DESCENDING)])
        db.sessions.create_index([("patientId", ASCENDING), ("date", DESCENDING)])
        db.patients.create_index("patient_id", unique=True)
        db.mri_results.create_index("patient_id", unique=True)
        db.reports.create_index([("patient_id", ASCENDING), ("created_at", DESCENDING)])
        db.report_preferences.create_index([("clinician_id", ASCENDING), ("updated_at", DESCENDING)])
        db.audit_events.create_index([("patient_id", ASCENDING), ("timestamp", DESCENDING)])
        db.mri_visits.create_index([("patient_id", ASCENDING), ("scanDate", ASCENDING)])


database = Database()

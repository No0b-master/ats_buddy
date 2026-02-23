import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import mysql.connector
from mysql.connector.abstracts import MySQLConnectionAbstract


class MigrationService:
    def __init__(self) -> None:
        self.db_config = self._resolve_db_config()
        self.migrations_dir = Path(__file__).resolve().parents[1] / "migrations"

    def run_migrations(self) -> None:
        self._ensure_database_exists()

        with self._get_connection() as conn:
            self._ensure_schema_migrations_table(conn)
            applied_versions = self._load_applied_versions(conn)

            migration_files = sorted(self.migrations_dir.glob("*.sql"))
            for migration_file in migration_files:
                version = migration_file.stem
                if version in applied_versions:
                    continue

                sql = migration_file.read_text(encoding="utf-8").strip()
                if not sql:
                    continue

                cursor = conn.cursor()
                cursor.execute(sql)
                cursor.execute(
                    """
                    INSERT INTO schema_migrations (version, filename, applied_at)
                    VALUES (%s, %s, %s)
                    """,
                    (version, migration_file.name, self._now_utc()),
                )
                conn.commit()

    def _ensure_database_exists(self) -> None:
        with self._get_connection(include_database=False) as conn:
            cursor = conn.cursor()
            cursor.execute(
                f"CREATE DATABASE IF NOT EXISTS `{self.db_config['database']}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
            )

    def _ensure_schema_migrations_table(self, conn: MySQLConnectionAbstract) -> None:
        cursor = conn.cursor()
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS schema_migrations (
                id BIGINT PRIMARY KEY AUTO_INCREMENT,
                version VARCHAR(255) NOT NULL UNIQUE,
                filename VARCHAR(255) NOT NULL,
                applied_at DATETIME NOT NULL
            ) ENGINE=InnoDB
            """
        )
        conn.commit()

    @staticmethod
    def _load_applied_versions(conn: MySQLConnectionAbstract) -> set[str]:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT version FROM schema_migrations")
        rows = cursor.fetchall()
        return {row["version"] for row in rows}

    def _get_connection(self, include_database: bool = True) -> MySQLConnectionAbstract:
        config = {
            "host": self.db_config["host"],
            "port": self.db_config["port"],
            "user": self.db_config["user"],
            "password": self.db_config["password"],
        }

        if include_database:
            config["database"] = self.db_config["database"]

        return mysql.connector.connect(**config)

    @staticmethod
    def _resolve_db_config() -> dict[str, Any]:
        host = os.getenv("MYSQL_HOST", "localhost")
        port = int(os.getenv("MYSQL_PORT", "3306"))
        user = os.getenv("MYSQL_USER", "root")
        password = os.getenv("MYSQL_PASSWORD", "")
        database = os.getenv("MYSQL_DATABASE", "ats_buddy")

        return {
            "host": host,
            "port": port,
            "user": user,
            "password": password,
            "database": database,
        }

    @staticmethod
    def _now_utc() -> datetime:
        return datetime.now(timezone.utc).replace(tzinfo=None)


def run_migrations() -> None:
    MigrationService().run_migrations()


if __name__ == "__main__":
    run_migrations()

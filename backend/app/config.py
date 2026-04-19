import os


class Settings:
    PROJECT_NAME: str = "Milk Distribution System"

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./milk.db").replace(
        "postgres://",
        "postgresql://",
        1,
    )
    FRONTEND_ORIGINS: str = os.getenv("FRONTEND_ORIGINS", "*")

    # Default Rate (can be made dynamic later)
    DEFAULT_RATE: float = 82.0


settings = Settings()

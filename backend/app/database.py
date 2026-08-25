import os
from importlib import import_module

from dotenv import load_dotenv

try:
    sqlalchemy = import_module("sqlalchemy")
    sqlalchemy_orm = import_module("sqlalchemy.orm")
except ModuleNotFoundError as exc:
    if exc.name and exc.name.startswith("sqlalchemy"):
        raise RuntimeError(
            "SQLAlchemy is required. Install it with: pip install sqlalchemy"
        ) from exc
    raise

create_engine = sqlalchemy.create_engine
declarative_base = sqlalchemy_orm.declarative_base
sessionmaker = sqlalchemy_orm.sessionmaker

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set")

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()
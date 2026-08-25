from importlib import import_module


try:
    BaseModel = import_module("pydantic").BaseModel
except ModuleNotFoundError:
    class BaseModel:
        """Fallback used only when Pydantic is unavailable in the environment."""

        def __init_subclass__(cls, **kwargs):
            return super().__init_subclass__(**kwargs)


class ProjectCreate(BaseModel):
    name: str
    description: str | None = None


class ProjectResponse(BaseModel):
    id: int
    name: str
    description: str | None = None

    class Config:
        from_attributes = True
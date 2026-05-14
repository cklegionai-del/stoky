from pydantic import BaseModel

class BaseModel(BaseModel):
    class Config:
        from_attributes = True

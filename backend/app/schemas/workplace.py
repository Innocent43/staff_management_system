from pydantic import BaseModel,ConfigDict,Field

class WorkplaceCreate(BaseModel):
    model_config=ConfigDict(str_strip_whitespace=True)

    name: str = Field(min_length=2, max_length=100)


class WorkplaceUpdate(BaseModel):
    model_config=ConfigDict(str_strip_whitespace=True)

    name: str | None = Field(default=0,min_length=2,max_length=100)
    active: bool | None = None


class WorkplaceOut(BaseModel):
    model_config=ConfigDict(from_attributes=True)


    id: int
    name: str
    active: bool



class QRTokenOut(BaseModel):
    token:str
    expires_in_seconds: int

    
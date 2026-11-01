from datetime import datetime,date

from pydantic import BaseModel,ConfigDict,Field,model_validator



class AuditFilters(BaseModel):
    action: str | None = Field(default=None,max_length=60)
    date_from: date | None = None
    date_to: date | None = None
    limit: int = Field(default=50,ge=1,le=100)
    offset: int = Field(default=0,ge=0)

    @model_validator(mode="after")
    def check_dates(self):
        if self.date_from and self.date_to and self.date_to < self.date_from:
            raise ValueError("date_to cannot be before date_from")

        return self



class AuditLogOut(BaseModel):
    model_config=ConfigDict(from_attributes=True)

    id: int
    actor_user_id: int | None

    action: str
    entity_type: str
    entity_id: int | None
    details: dict | None
    created_at: datetime

    
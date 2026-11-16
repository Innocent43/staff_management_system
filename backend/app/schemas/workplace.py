
from pydantic import BaseModel, ConfigDict, Field


class WorkplaceCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str = Field(min_length=2, max_length=100)

    # Both coordinates must be provided together.
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)

    # Default 100m; maximum 1000m for the current circular geofence.
    geofence_radius_m: int = Field(default=100, ge=10, le=1000)

    require_location_verification: bool = False
    address: str | None = Field(default=None, max_length=500)


class WorkplaceUpdate(BaseModel):
    model_config = ConfigDict(
        str_strip_whitespace=True,
        extra="forbid",
    )

    name: str | None = Field(default=None, min_length=2, max_length=100)
    active: bool | None = None

    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)

    geofence_radius_m: int | None = Field(default=None, ge=10, le=1000)
    require_location_verification: bool | None = None
    address: str | None = Field(default=None, max_length=500)


class WorkplaceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    active: bool

    latitude: float | None
    longitude: float | None
    geofence_radius_m: int
    require_location_verification: bool
    address: str | None


class QRTokenOut(BaseModel):
    token: str
    expires_in_seconds: int






class AddressSuggestionOut(BaseModel):
    id: str
    formatted: str
    address_line1: str | None = None
    address_line2: str | None = None
    latitude: float
    longitude: float


class AddressSearchOut(BaseModel):
    suggestions: list[AddressSuggestionOut]


class AddressReverseOut(BaseModel):
    address: str | None = None

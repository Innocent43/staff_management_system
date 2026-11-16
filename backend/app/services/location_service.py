
from math import asin, cos, radians, sin, sqrt

from fastapi import HTTPException, status

from app.models.workplace_qr import WorkplaceQR


# Maximum GPS accuracy we accept when location verification is required.
MAX_GPS_ACCURACY_M = 100.0

# Average radius of the Earth in metres.
EARTH_RADIUS_M = 6_371_000


def calculate_distance_m(
    latitude: float,
    longitude: float,
    workplace_latitude: float,
    workplace_longitude: float,
) -> float:
    """
    Calculate the distance between an employee's GPS coordinates
    and the workplace coordinates using the Haversine formula.

    Returns the distance in metres.
    """

    employee_lat = radians(latitude)
    employee_lon = radians(longitude)

    workplace_lat = radians(workplace_latitude)
    workplace_lon = radians(workplace_longitude)

    lat_difference = workplace_lat - employee_lat
    lon_difference = workplace_lon - employee_lon

    a = (
        sin(lat_difference / 2) ** 2
        + cos(employee_lat)
        * cos(workplace_lat)
        * sin(lon_difference / 2) ** 2
    )

    a = min(1.0, max(0.0, a))
    central_angle = 2 * asin(sqrt(a))
    return EARTH_RADIUS_M * central_angle


def verify_workplace_location(
    *,
    latitude: float | None,
    longitude: float | None,
    accuracy_m: float | None,
    workplace: WorkplaceQR,
) -> float | None:
    """
    Validate an employee's location against the workplace geofence.

    Returns:
        Distance from workplace in metres, or None if location
        verification is not possible or not required.

    Raises:
        HTTPException if required location verification fails.
    """

    # Check workplace configuration first.
    if workplace.require_location_verification:
        if (
            workplace.latitude is None
            or workplace.longitude is None
        ):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Workplace location verification is not properly configured.",
            )

    # Check whether the employee supplied location information.
    if (
        latitude is None
        or longitude is None
        or accuracy_m is None
    ):
        if workplace.require_location_verification:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Location information is required for attendance.",
            )

        return None

    # We cannot calculate a distance without workplace coordinates.
    if (
        workplace.latitude is None
        or workplace.longitude is None
    ):
        return None

    distance_m = calculate_distance_m(
        latitude=latitude,
        longitude=longitude,
        workplace_latitude=workplace.latitude,
        workplace_longitude=workplace.longitude,
    )

    # If verification is disabled, collect the distance as evidence
    # without blocking attendance.
    if not workplace.require_location_verification:
        return round(distance_m, 2)

    # Reject GPS readings that are too inaccurate.
    if accuracy_m > MAX_GPS_ACCURACY_M:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="GPS accuracy is too low. Please try again with a better GPS signal.",
        )

    # Require the reported accuracy area to fit inside the geofence.
    # This avoids accepting an employee whose reported location is
    # near the boundary but whose GPS uncertainty extends outside it.
    if distance_m + accuracy_m > workplace.geofence_radius_m:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are outside the permitted workplace attendance area.",
        )

    return round(distance_m, 2)

"""add workplace geofence constraints"""

from typing import Sequence, Union

from alembic import op

revision: str = "887f673796df"
down_revision: Union[str, Sequence[str], None] = "3443450f2110"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_check_constraint(
        "ck_workplace_geofence_radius",
        "workplace_qrs",
        "geofence_radius_m BETWEEN 10 AND 1000",
    )

    op.create_check_constraint(
        "ck_workplace_coordinates_together",
        "workplace_qrs",
        "(latitude IS NULL AND longitude IS NULL) OR "
        "(latitude IS NOT NULL AND longitude IS NOT NULL)",
    )


def downgrade() -> None:
    op.drop_constraint(
        "ck_workplace_coordinates_together",
        "workplace_qrs",
        type_="check",
    )

    op.drop_constraint(
        "ck_workplace_geofence_radius",
        "workplace_qrs",
        type_="check",
    )
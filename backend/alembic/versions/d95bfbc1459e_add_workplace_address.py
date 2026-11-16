"""add workplace address

Revision ID: d95bfbc1459e
Revises: 887f673796df
Create Date: 2026-11-16 17:46:03.279142

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "d95bfbc1459e"
down_revision: Union[str, Sequence[str], None] = "887f673796df"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "workplace_qrs",
        sa.Column("address", sa.String(length=500), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("workplace_qrs", "address")
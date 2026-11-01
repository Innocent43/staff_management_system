"""fix completed_at and rename wage rule column

Revision ID: be901ff0fcf1
Revises: 9266f1eb2660
Create Date: 2026-10-30 23:46:00.370122

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'be901ff0fcf1'
down_revision: Union[str, Sequence[str], None] = '9266f1eb2660'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.alter_column(
        'task_assignments', 'completed_at',
        existing_type=postgresql.TIMESTAMP(timezone=True),
        nullable=True,
    )
    op.alter_column(
        'wage_rules', 'deduct_schedule_break',
        new_column_name='deduct_scheduled_break',
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.alter_column(
        'wage_rules', 'deduct_scheduled_break',
        new_column_name='deduct_schedule_break',
    )
    op.alter_column(
        'task_assignments', 'completed_at',
        existing_type=postgresql.TIMESTAMP(timezone=True),
        nullable=False,
    )

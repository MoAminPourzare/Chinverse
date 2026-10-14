"""Persist multiple professional titles without losing existing headlines.

Revision ID: b3e8d1f6a9c2
Revises: a7d3e9b1c5f8
"""
from alembic import op
import sqlalchemy as sa

revision = "b3e8d1f6a9c2"
down_revision = "a7d3e9b1c5f8"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("user_profiles", sa.Column("job_titles", sa.JSON(), nullable=True))
    profiles = sa.table("user_profiles", sa.column("user_id", sa.BigInteger()), sa.column("headline", sa.String()), sa.column("job_titles", sa.JSON()))
    connection = op.get_bind()
    for user_id, headline in connection.execute(sa.select(profiles.c.user_id, profiles.c.headline).where(profiles.c.headline.is_not(None))):
        title = headline.strip()
        connection.execute(profiles.update().where(profiles.c.user_id == user_id).values(job_titles=[title] if title else []))


def downgrade():
    op.drop_column("user_profiles", "job_titles")

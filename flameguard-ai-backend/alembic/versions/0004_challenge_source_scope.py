"""Allow explicitly classified challenge sources without a fabricated investigation."""

import sqlalchemy as sa

from alembic import op

revision = "0004_challenge_source_scope"
down_revision = "0003_could_have"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "source_document",
        sa.Column("source_scope", sa.Text(), server_default="investigation", nullable=False),
    )
    op.alter_column("source_document", "investigation_id", existing_type=sa.UUID(), nullable=True)
    op.create_check_constraint(
        "source_scope_ownership",
        "source_document",
        "(source_scope = 'investigation' AND investigation_id IS NOT NULL) OR "
        "(source_scope = 'challenge' AND investigation_id IS NULL)",
    )


def downgrade() -> None:
    # Refuse loss of resource ownership; an operator must explicitly export/remove them first.
    if op.get_bind().scalar(
        sa.text("SELECT EXISTS(SELECT 1 FROM source_document WHERE investigation_id IS NULL)")
    ):
        raise RuntimeError("Export and explicitly remove challenge sources before downgrade")
    op.drop_constraint("source_scope_ownership", "source_document", type_="check")
    op.alter_column("source_document", "investigation_id", existing_type=sa.UUID(), nullable=False)
    op.drop_column("source_document", "source_scope")

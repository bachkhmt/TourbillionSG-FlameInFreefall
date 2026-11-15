from sqlalchemy import select

from app.models import Investigation, TestCondition, TestRun
from app.repositories.phase4_catalog import investigation_selection


async def descriptive_rows(session, query):
    """Catalog filters select investigations, then all their source records are counted."""
    studies = (
        await session.scalars(
            select(Investigation)
            .where(Investigation.id.in_(investigation_selection(query)))
            .order_by(Investigation.id)
        )
    ).all()
    if query.investigation_id is not None:
        studies = [s for s in studies if s.id == query.investigation_id]
    ids = [s.id for s in studies]
    runs = (
        await session.scalars(
            select(TestRun).where(TestRun.investigation_id.in_(ids)).order_by(TestRun.id)
        )
    ).all()
    conditions = (
        await session.scalars(
            select(TestCondition)
            .join(TestRun)
            .where(TestRun.investigation_id.in_(ids))
            .order_by(TestCondition.id)
        )
    ).all()
    return studies, runs, conditions

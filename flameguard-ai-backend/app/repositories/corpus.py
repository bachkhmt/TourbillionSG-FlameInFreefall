from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import DocumentChunk, SourceDocument


async def chunk_rows(session: AsyncSession, investigation: UUID | None = None):
    """(chunk, source) pairs read inside the caller's admitted read snapshot."""
    statement = (
        select(DocumentChunk, SourceDocument)
        .join(SourceDocument, DocumentChunk.source_document_id == SourceDocument.id)
        .order_by(DocumentChunk.id)
    )
    if investigation is not None:
        statement = statement.where(SourceDocument.investigation_id == investigation)
    return (await session.execute(statement)).all()

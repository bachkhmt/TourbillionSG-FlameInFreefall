"""Minimal, dependency-free reader for the cell values stored in an .xlsx file.

Reads only what the workbook already contains: shared strings, inline strings and the
cached result of each formula. Formulas are never re-evaluated, number formats are
not applied (dates stay as Excel serial numbers) and the raw XML text of every value
is kept so callers can quote it exactly. Each cell carries its sheet name and A1
reference for use as a source locator.
"""

from __future__ import annotations

import io
import posixpath
import re
import zipfile
from dataclasses import dataclass
from xml.etree import ElementTree

NS = {
    "m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    "rel": "http://schemas.openxmlformats.org/package/2006/relationships",
}
_REF = re.compile(r"([A-Z]+)(\d+)")


@dataclass(frozen=True)
class Cell:
    sheet: str
    ref: str
    row: int
    column: int
    value: str | None  # raw stored text (shared/inline string, number text or cached result)
    formula: bool  # True when the stored value is a cached formula result

    @property
    def locator(self) -> str:
        return f"xlsx '{self.sheet}'!{self.ref}"


def column_index(letters: str) -> int:
    n = 0
    for ch in letters:
        n = n * 26 + ord(ch) - 64
    return n


def _text(node) -> str:
    return "".join(t.text or "" for t in node.iter(f"{{{NS['m']}}}t"))


def read_workbook(data: bytes) -> dict[str, list[Cell]]:
    """Return ``{sheet name: [cells in document order]}`` for every worksheet."""
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        names = set(archive.namelist())
        shared = []
        if "xl/sharedStrings.xml" in names:
            root = ElementTree.fromstring(archive.read("xl/sharedStrings.xml"))
            shared = [_text(si) for si in root.findall("m:si", NS)]
        rels = ElementTree.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
        targets = {r.get("Id"): r.get("Target") for r in rels.findall("rel:Relationship", NS)}
        workbook = ElementTree.fromstring(archive.read("xl/workbook.xml"))
        sheets: dict[str, list[Cell]] = {}
        for sheet in workbook.findall("m:sheets/m:sheet", NS):
            name = sheet.get("name")
            target = targets[sheet.get(f"{{{NS['r']}}}id")]
            path = target.lstrip("/") if target.startswith("/") else posixpath.join("xl", target)
            root = ElementTree.fromstring(archive.read(posixpath.normpath(path)))
            cells = []
            for c in root.iter(f"{{{NS['m']}}}c"):
                ref = c.get("r")
                match = _REF.fullmatch(ref or "")
                if not match:
                    raise ValueError(f"Cell without an A1 reference in sheet {name!r}")
                kind = c.get("t")
                v = c.find("m:v", NS)
                if kind == "inlineStr":
                    node = c.find("m:is", NS)
                    value = _text(node) if node is not None else None
                elif v is None or v.text is None:
                    value = None
                elif kind == "s":
                    value = shared[int(v.text)]
                else:  # n, b, e, str (formula string) or untyped number
                    value = v.text
                cells.append(
                    Cell(
                        sheet=name,
                        ref=ref,
                        row=int(match.group(2)),
                        column=column_index(match.group(1)),
                        value=value,
                        formula=c.find("m:f", NS) is not None,
                    )
                )
            sheets[name] = cells
    return sheets


def rows(cells: list[Cell]) -> dict[int, dict[int, Cell]]:
    """Group cells as ``{row: {column: cell}}``, keeping only cells with a value."""
    grouped: dict[int, dict[int, Cell]] = {}
    for cell in cells:
        if cell.value not in (None, ""):
            grouped.setdefault(cell.row, {})[cell.column] = cell
    return grouped

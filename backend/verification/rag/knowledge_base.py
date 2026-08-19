from pathlib import Path


class KnowledgeBase:
    def __init__(self, directory: Path | None = None) -> None:
        self.directory = directory or Path(__file__).resolve().parent / "trusted_documents"

    def load_documents(self, inline_documents: list[str] | None = None) -> list[tuple[str, str]]:
        documents: list[tuple[str, str]] = []
        if self.directory.exists():
            for path in sorted(self.directory.glob("*.md")):
                documents.append((path.name, path.read_text(encoding="utf-8")))
        for index, text in enumerate(inline_documents or [], start=1):
            documents.append((f"inline_{index}", text))
        return documents

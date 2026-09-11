# /// script
# requires-python = ">=3.11"
# dependencies = ["rich>=13.7"]
# ///
"""Register a new vocabulary text file in Anki Scribe.

Performs three edits:
  1. index.html  -> add the filename to DEFAULT_VOCAB_FILES
  2. index.html  -> bump APP_VERSION and add a CHANGELOG entry
  3. sw.js       -> bump CACHE_NAME (anki-scribe-vN -> vN+1)

Usage:
    uv run add_vocab.py Lekcja-7_str60.txt --topic "Travel"
    uv run add_vocab.py new.txt --topic Food --bump minor
    uv run add_vocab.py new.txt --topic Food --dry-run
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

from rich.console import Console
from rich.panel import Panel
from rich.table import Table

console = Console()

ROOT = Path(__file__).resolve().parent
INDEX = ROOT / "index.html"
SW = ROOT / "sw.js"

RE_VOCAB_LIST = re.compile(
    r"(const DEFAULT_VOCAB_FILES = \[)(.*?)(\n(\s*)\];)", re.DOTALL
)
RE_APP_VERSION = re.compile(r"(const APP_VERSION = ')([0-9]+\.[0-9]+\.[0-9]+)(';)")
RE_CHANGELOG = re.compile(r"(const CHANGELOG = \{\n)", re.DOTALL)
RE_CACHE_NAME = re.compile(r"(const CACHE_NAME = 'anki-scribe-v)(\d+)(';)")


class StepError(RuntimeError):
    pass


def bump(version: str, part: str) -> str:
    major, minor, patch = (int(x) for x in version.split("."))
    if part == "major":
        return f"{major + 1}.0.0"
    if part == "minor":
        return f"{major}.{minor + 1}.0"
    return f"{major}.{minor}.{patch + 1}"


def js_string(value: str) -> str:
    """Escape a python string for embedding in a single-quoted JS literal."""
    return value.replace("\\", "\\\\").replace("'", "\\'")


def add_to_vocab_list(html: str, filename: str) -> tuple[str, str]:
    match = RE_VOCAB_LIST.search(html)
    if not match:
        raise StepError("DEFAULT_VOCAB_FILES array not found in index.html")

    head, body, tail, indent = match.groups()
    if f"'{filename}'" in body:
        return html, f"already listed in DEFAULT_VOCAB_FILES"

    entry_indent = indent + "  "
    new_body = body.rstrip().rstrip(",") + f",\n{entry_indent}'{js_string(filename)}'"
    html = html[: match.start()] + head + new_body + tail + html[match.end() :]
    return html, f"added to DEFAULT_VOCAB_FILES"


def bump_version_and_changelog(
    html: str, filename: str, topic: str, part: str
) -> tuple[str, str, str]:
    match = RE_APP_VERSION.search(html)
    if not match:
        raise StepError("APP_VERSION constant not found in index.html")

    old_version = match.group(2)
    new_version = bump(old_version, part)
    html = html[: match.start()] + match.group(1) + new_version + match.group(3) + html[match.end() :]

    stem = js_string(Path(filename).stem)
    entry = (
        f"      '{new_version}': [\n"
        f"        'New vocabulary added: \"{stem}\" \u2014 topic: {js_string(topic)}.'\n"
        f"      ],\n"
    )
    cl = RE_CHANGELOG.search(html)
    if not cl:
        raise StepError("CHANGELOG object not found in index.html")
    html = html[: cl.end()] + entry + html[cl.end() :]

    return html, old_version, new_version


def bump_cache_name(js: str) -> tuple[str, str, str]:
    match = RE_CACHE_NAME.search(js)
    if not match:
        raise StepError("CACHE_NAME constant not found in sw.js")
    old = match.group(2)
    new = str(int(old) + 1)
    js = js[: match.start()] + match.group(1) + new + match.group(3) + js[match.end() :]
    return js, f"anki-scribe-v{old}", f"anki-scribe-v{new}"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("file", help="Vocabulary .txt file (must live next to index.html)")
    parser.add_argument("--topic", required=True, help='Topic shown in the changelog, e.g. "Food"')
    parser.add_argument(
        "--bump",
        choices=("major", "minor", "patch"),
        default="minor",
        help="Which part of APP_VERSION to bump (default: minor)",
    )
    parser.add_argument("--dry-run", action="store_true", help="Show changes without writing")
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    source = Path(args.file)
    target = ROOT / source.name
    if not target.is_file():
        console.print(f"[red]Vocabulary file not found:[/red] {target}")
        return 1
    for path in (INDEX, SW):
        if not path.is_file():
            console.print(f"[red]Missing:[/red] {path}")
            return 1

    filename = target.name
    line_count = sum(
        1
        for line in target.read_text(encoding="utf-8").splitlines()
        if line.strip() and not line.startswith("#")
    )

    try:
        html = INDEX.read_text(encoding="utf-8")
        html, list_note = add_to_vocab_list(html, filename)
        html, old_version, new_version = bump_version_and_changelog(
            html, filename, args.topic, args.bump
        )

        js = SW.read_text(encoding="utf-8")
        js, old_cache, new_cache = bump_cache_name(js)
    except StepError as exc:
        console.print(f"[red]Error:[/red] {exc}")
        return 1

    table = Table(show_header=True, header_style="bold cyan", box=None, pad_edge=False)
    table.add_column("Change")
    table.add_column("Before")
    table.add_column("After", style="green")
    table.add_row("Vocabulary file", "-", f"{filename} ({line_count} words)")
    table.add_row("index.html list", "", list_note)
    table.add_row("APP_VERSION", old_version, new_version)
    table.add_row("Changelog topic", "-", args.topic)
    table.add_row("sw.js CACHE_NAME", old_cache, new_cache)

    console.print(Panel(table, title="Anki Scribe - add vocabulary", border_style="cyan"))

    if args.dry_run:
        console.print("[yellow]Dry run - nothing written.[/yellow]")
        return 0

    INDEX.write_text(html, encoding="utf-8")
    SW.write_text(js, encoding="utf-8")
    console.print(f"[bold green]Done.[/bold green] Version {new_version} is ready to ship.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

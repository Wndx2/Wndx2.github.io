import hashlib
import subprocess
import tempfile
from pathlib import Path

from flask import Flask, jsonify, render_template, request

APP_DIR = Path(__file__).resolve().parent
CACHE_DIR = APP_DIR / "render_cache"
CACHE_DIR.mkdir(exist_ok=True)

FMT_DIR = APP_DIR / "fmt_cache"
FMT_DIR.mkdir(exist_ok=True)
FMT_NAME = "epsilonfmt"

app = Flask(__name__)

PREAMBLE = r"""
\documentclass[preview,border=2pt,varwidth]{standalone}
\usepackage[utf8]{inputenc}
\usepackage[T1]{fontenc}
\usepackage{amsmath,amssymb,amsfonts,amsthm}
\usepackage{mathtools}
\usepackage{physics}
\usepackage{xcolor}
\usepackage{siunitx}
\usepackage{cancel}
\usepackage{bm} # for like $\math{bb}$
\pagestyle{empty}
"""

DOC_HEAD = r"""
\begin{document}
\color{white}
$\displaystyle
"""

DOC_TAIL = r"""
$
\end{document}
"""

LATEX_TIMEOUT_SECONDS = 20


def build_source(body: str) -> str:
    return DOC_HEAD + body + DOC_TAIL


def ensure_format() -> None:
    fmt_file = FMT_DIR / f"{FMT_NAME}.fmt"
    if fmt_file.exists():
        return

    preamble_file = FMT_DIR / f"{FMT_NAME}.tex"
    preamble_file.write_text(PREAMBLE + "\n\\dump\n", encoding="utf-8")

    subprocess.run(
        [
            "latex",
            "-ini",
            "-interaction=batchmode",
            f"-jobname={FMT_NAME}",
            "&latex",
            preamble_file.name,
        ],
        cwd=FMT_DIR,
        stdin=subprocess.DEVNULL,
        capture_output=True,
        text=True,
        timeout=60,
        check=False,
    )

    if not fmt_file.exists():
        raise RuntimeError("Failed to build precompiled LaTeX format.")


def compile_to_svg(body: str) -> dict:
    key = hashlib.sha256(body.encode("utf-8")).hexdigest()
    cached = CACHE_DIR / f"{key}.svg"
    if cached.exists():
        return {"ok": True, "svg": cached.read_text(encoding="utf-8")}

    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)
        tex_file = tmp_path / "doc.tex"
        tex_file.write_text(build_source(body), encoding="utf-8")

        try:
            proc = subprocess.run(
                [
                    "latex",
                    f"-fmt={FMT_DIR / FMT_NAME}",
                    "-interaction=nonstopmode",
                    "-halt-on-error",
                    "-no-shell-escape",
                    "-output-directory",
                    str(tmp_path),
                    str(tex_file),
                ],
                cwd=tmp_path,
                capture_output=True,
                text=True,
                timeout=LATEX_TIMEOUT_SECONDS,
            )
        except subprocess.TimeoutExpired:
            return {"ok": False, "error": "LaTeX compilation timed out."}

        if proc.returncode != 0:
            return {"ok": False, "error": extract_log_error(proc.stdout, tmp_path)}

        dvi_file = tmp_path / "doc.dvi"
        if not dvi_file.exists():
            return {"ok": False, "error": "LaTeX did not produce output."}

        svg_file = tmp_path / "doc.svg"
        try:
            proc = subprocess.run(
                [
                    "dvisvgm",
                    "--no-fonts=0",
                    "--font-format=woff",
                    "--bbox=preview",
                    "--exact",
                    "-o",
                    str(svg_file),
                    str(dvi_file),
                ],
                cwd=tmp_path,
                capture_output=True,
                text=True,
                timeout=LATEX_TIMEOUT_SECONDS,
            )
        except subprocess.TimeoutExpired:
            return {"ok": False, "error": "SVG conversion timed out."}

        if proc.returncode != 0 or not svg_file.exists():
            stderr = proc.stderr[-2000:].replace(str(tmp_path) + "/", "")
            return {"ok": False, "error": stderr or "dvisvgm failed."}

        svg_content = svg_file.read_text(encoding="utf-8")
        cached.write_text(svg_content, encoding="utf-8")
        return {"ok": True, "svg": svg_content}


def extract_log_error(stdout: str, tmp_path: Path) -> str:
    lines = stdout.splitlines()
    error_lines = [ln for ln in lines if ln.startswith("!")]
    if error_lines:
        idx = lines.index(error_lines[0])
        snippet = lines[idx : idx + 6]
        text = "\n".join(snippet).strip()
        return text.replace(str(tmp_path) + "/", "")
    return "LaTeX compilation failed."


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/render", methods=["POST"])
def render_latex():
    data = request.get_json(silent=True) or {}
    body = data.get("latex", "")

    if not isinstance(body, str) or not body.strip():
        return jsonify({"ok": False, "error": ""}), 200

    if len(body) > 20000:
        return jsonify({"ok": False, "error": "Input too long."}), 200

    result = compile_to_svg(body)
    status = 200
    return jsonify(result), status


ensure_format()

if __name__ == "__main__":
    app.run(debug=True, port=5001)

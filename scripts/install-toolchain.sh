#!/usr/bin/env bash
# Install the course's pinned local toolchain (COURSE-PLAN.md, "Stack and pins"), ported from
# spark-ecommerce-analytics:
#   CPython 3.14.9 in /usr/local as `python` and `python3.14` — the generator, the extractor, the
#     producers, the gates; Beam (Python SDK) and PySpark 4.2.0 both support 3.14
#   a Java 21 runtime — Spark is a JVM program
# PostgreSQL 18.6 is scripts/setup-postgres.sh (sql-bank's). Usable as a cloud environment's setup
# script. Needs network access to PyPI.
set -euo pipefail
PIN=3.14.9
if [ "$(python -c 'import platform; print(platform.python_version())' 2>/dev/null)" != "$PIN" ] ||
   [ "$(python3.14 -c 'import platform; print(platform.python_version())' 2>/dev/null)" != "$PIN" ]; then
  work=$(mktemp -d)
  python3 -m pip download "uv==0.13.5" --no-deps -q -d "$work"
  python3 -m zipfile -e "$work"/uv-*.whl "$work/uv"
  uv=$(find "$work/uv" -path '*data/scripts/uv'); chmod +x "$uv"
  "$uv" python install "$PIN" --install-dir "$work/py"
  cp -a "$work/py/cpython-$PIN-linux-x86_64-gnu/." /usr/local/
  ln -sf python3.14 /usr/local/bin/python
  # uv links python3.14 into ~/.local/bin, AHEAD of /usr/local/bin on PATH: a venv made through it
  # would record a scratch path in pyvenv.cfg.
  rm -f ~/.local/bin/python3.14
  rm -rf "$work"
fi
python -c 'import platform; assert platform.python_version() == "'$PIN'"'
if ! java -version 2>&1 | grep -q 'version "21\.'; then
  if command -v apt-get >/dev/null; then apt-get install -y -q openjdk-21-jre-headless >/dev/null; fi
fi
java -version 2>&1 | grep -q 'version "21\.' || { echo "✗ Java 21 is required (java -version)"; exit 1; }
echo "python $PIN in /usr/local; java 21 on PATH"

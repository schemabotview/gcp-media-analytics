#!/usr/bin/env python3
"""Scan every file git would commit for a real GCP value (CLAUDE.md, "Invariants").

  python scripts/leaks.py      exit 1 on any hit; needs the GOOGLE_* environment secrets

The recorder refuses a leaking transcript, but a transcript is not the only file a step writes. This
runs the recorder's own check (as written, and with line breaks removed) over the whole tree, plus
the project number, which only an API call knows. Run it before every commit that holds a recording.
"""
import json
import os
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from spine import Normaliser  # noqa: E402

REPO = Path(__file__).resolve().parent.parent
if not (os.environ.get('GOOGLE_PROJECT_ID') and os.environ.get('GOOGLE_CREDENTIALS')):
    sys.exit('✗ the GOOGLE_* secrets are not in the environment: nothing to scan for')
creds = json.loads(os.environ['GOOGLE_CREDENTIALS'])
real = {'project': os.environ['GOOGLE_PROJECT_ID'], 'account': creds.get('client_email', ''),
        'client': creds.get('client_id', ''), 'key id': creds.get('private_key_id', ''),
        'number': os.environ.get('GOOGLE_PROJECT_NUMBER', '')}
norm = Normaliser(real, {})
listed = subprocess.run(['git', 'ls-files', '--cached', '--others', '--exclude-standard'], cwd=REPO,
                        capture_output=True, text=True, check=True).stdout.split('\n')
hits = 0
for name in filter(None, listed):
    try:
        text = (REPO / name).read_text()
    except (UnicodeDecodeError, IsADirectoryError, FileNotFoundError):
        continue  # binary state archives hold only local data: no GCP call makes them
    for what in norm.refuse(text):
        hits += 1
        print(f'✗ {name}: {what}')
print(f"{'✗' if hits else '✓'} {len(listed)} file(s) scanned, {hits} leak(s)")
sys.exit(1 if hits else 0)

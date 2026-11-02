#!/usr/bin/env python3
"""Build the spine one step at a time, each from the state the step before it left; check it all
without running anything.

The spine is the course's one project, `viewing-pulse`, kept as real files: one snapshot per step in
spine/<course>/<NN-step>/project/. Each step's session.txt is the terminal pane a scene shows — `$ `
lines are commands, everything else is their output. Scenes import these files with Vite's `?raw`,
so a frame can only show what a real run printed.

  python scripts/spine.py                  check: every step written, current and untouched. Runs
                                           NOTHING (< 1 s)
  python scripts/spine.py --write <steps>  write local steps: each runs ONCE, from the saved state of
                                           the local step before it, and saves its own state
  python scripts/spine.py --record <step>  record ONE GCP step in the owner's project (needs the
                                           GOOGLE_* environment secrets): run once, normalise, write
  python scripts/spine.py --replay [steps] deliberate, after a tool upgrade: run the local chain from
                                           its start and compare every transcript
  python scripts/spine.py --teardown       terraform destroy what infra/ made (after a course)

Ported from azure-trade-finance (itself from spark-ecommerce-analytics and aws-ecommerce). STEP BY
STEP, NEVER AGAIN AND AGAIN: each step is written once, starting from what the step before it left.

  Local   after its session, the step's whole state is saved beside it in state/: the two source
          databases (db-crm.sql.gz, db-billing.sql.gz, pg_dump), the raw zone (gcs.tar.gz,
          fake-gcs-server's folder) and the working copy (work.tar.gz, without .venv or data/,
          which sun_gen's cache lays back).
          `--write land/04` restores land/03's state, lays land/04's files, runs land/04's
          commands, saves land/04's state. A branch saves none: the step after it starts from the
          state before it.
  GCP     recorded once (--record) in the owner's project, as the step before it left it.

Both write recorded.json: the step's KEY and the hash of its transcript. The key hashes the step's
step.json, files and typed commands, and every ancestor's files and RECORDED transcript, so editing
or rewriting a step makes every step after it stale (check names them; write them again, in order).
Not scripts/: improving the machine forces nothing.

TWO KINDS OF STEP (COURSE-PLAN.md, "The spine"):

  Local ({})            run here, deterministically: PostgreSQL 18.6 (the CRM and billing),
                        fake-gcs-server (the raw zone, emulated), Python 3.14.9. The pipeline's
                        numbers all come from here or from seeded data recorded on GCP.
  GCP ({"gcp": true})   run once in the owner's project. A GCP step changes no local state, so a
                        local step after it starts from the last local step's state.

ONE CHAIN, REAL STATE. The local steps run in ONE working copy (/home/priya/viewing-pulse, as Priya,
the path shown on screen — nothing is rewritten), against the two databases (`crm`, `billing`) and
ONE fake-gcs-server, in chain order from the `first` step. A step's files are laid over the working
copy (a file it no longer has is removed; run outputs, data/ and .venv stay) and its session runs
where the previous one left off.

  {"branch": true}      a step that breaks things on purpose (a failed gate): its state is put back
                        as it was before it, so the next step continues from the step before the
                        branch. Its CODE carries on, like any step's.

THE SPINE IS CUMULATIVE: every step is its parent plus the changes it declares.

  {"first": true}             starts the chain
  {"from": "land/03-...",     continues that step; `changes` lists every path it adds, edits or
   "changes": ["extract/"]}   removes (a directory covers everything under it). `[]` only looks.
  {"lab": true}               a standalone lab outside the chain (fresh databases and raw zone)

step.json (other keys, all optional):
  {"venv": true}          run with the project's .venv (requirements.txt) activated; built silently
  {"env": true}           `source env.sh` silently first, as Priya's shell profile does; a file name
                          sources that file instead (`"env": "gcp.sh"`: a GCP step's shell)
  {"setup": ["cmd"]}      run silently before the session: ONLY what happens off screen between two
                          sections (billing's business day), never the pipeline's own state
  {"generated": ["crm", "billing", "catalogue", "epg"]}  sun_gen's parts, into data/<part>/ (not
                          committed; cached by the generator's source)
  {"capture": ["path"]}   files the session writes that a scene shows; saved to captured/. A path
                          `gs://<bucket>/<object>` is an object, read back after the session
  {"volatile": true}      compared with digits, hex and UUIDs masked; or a list: ["uuid"], ["digits"]
  {"columns": 80}         the pane's width (default 80): output wider than it wraps, as a terminal does
  {"local_state": true}   a GCP step that reads the source systems: the local parent's databases are
                          restored first (§5.6 copies billing to the real bucket)
"""
from __future__ import annotations

import difflib
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import time
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
ROOT = REPO / 'spine'
# Course order: the chain runs through the courses in this order (COURSE-PLAN.md, "The courses").
COURSES = ['intro', 'how-gcp-runs', 'start', 'secure', 'land', 'stream', 'dataflow', 'lakehouse', 'dataproc', 'serve',
           'orchestrate', 'operate']
USER = 'priya'
HOME = Path('/home') / USER
PROJECT = 'viewing-pulse'
WORK = HOME / PROJECT
DBS = ('crm', 'billing')
SPINE_ROOT = Path(os.environ.get('SPINE_ROOT', '/tmp/viewing-pulse-spine'))
PINNED = 'Python 3.14.9'
PYTHON = '/usr/local/bin/python3.14'
PG_MAJOR = 18
GCS_PORT = 4443
BUCKETS = ('sun-media-dev-raw',)  # what infra/ makes on GCP; the emulator gets them empty at a chain's start
# Run outputs, the venv, generated data: never part of a step's snapshot, never removed by a lay.
# Terraform's local state and saved plans hold real ids: never in a snapshot, never in a state archive.
IGNORED = {'__pycache__', '.venv', 'data', 'out', '.terraform', 'terraform.tfstate', 'terraform.tfstate.backup', 'tfplan',
           'jars', 'logs', 'spark-warehouse', 'metastore_db'}
MARK = '__SPINE_MARK__'
UUID = re.compile(r'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}')
ANSI = re.compile(r'\x1b\[[0-9;?]*[@-~]|\x1b[=>]|\r')


# ── the steps ─────────────────────────────────────────────────────────────────────────────────────

def config_of(step: Path) -> dict:
    return json.loads((step / 'step.json').read_text()) if (step / 'step.json').exists() else {}


def name_of(step: Path) -> str:
    return step.relative_to(ROOT).as_posix()


def every_step() -> list[Path]:
    steps = [p.parent for p in ROOT.glob('*/*/step.json')]
    order = {c: i for i, c in enumerate(COURSES)}
    for s in steps:
        if s.parent.name not in order:
            sys.exit(f'✗ {name_of(s)}: course "{s.parent.name}" is not in COURSES')
    return sorted(steps, key=lambda s: (order[s.parent.name], s.name))


def files(step: Path) -> dict[str, bytes]:
    """A step's project as {relative path: bytes}, without run outputs."""
    root = step / 'project'
    if not root.exists():
        return {}
    return {p.relative_to(root).as_posix(): p.read_bytes() for p in sorted(root.rglob('*'))
            if p.is_file() and not IGNORED & set(p.relative_to(root).parts) and p.suffix != '.pyc'}


def commands(session: str) -> list[str]:
    return [line[2:] for line in session.splitlines() if line.startswith('$ ')]


def lineage(step: Path) -> list[str]:
    """Why this step is not its parent plus its declared changes (empty when it is)."""
    name, config = name_of(step), config_of(step)
    kinds = [k for k in ('first', 'from', 'lab') if config.get(k)]
    if len(kinds) != 1:
        return [f'{name}: step.json needs exactly one of "first", "from", "lab" (has {kinds or "none"})']
    if 'from' not in kinds:
        return [f'{name}: "changes" only means something with "from"'] if config.get('changes') else []
    parent = ROOT / config['from']
    if not (parent / 'step.json').exists():
        return [f'{name}: "from" names {config["from"]}, which is not a step']
    if config_of(parent).get('lab'):
        return [f'{name}: "from" names a lab, which is outside the chain']
    if 'changes' not in config:
        return [f'{name}: "from" without "changes" (use [] for a section that only looks)']
    changes = config['changes']
    under = lambda path, c: path == c or path.startswith(c.rstrip('/') + '/')
    before, after = files(parent), files(step)
    differs = {p for p in before.keys() | after.keys() if before.get(p) != after.get(p)}
    out = [f'{name}: {p} differs from {config["from"]} but is not in "changes"' for p in sorted(differs) if not any(under(p, c) for c in changes)]
    out += [f'{name}: "changes" lists {c}, which did not change' for c in changes if not any(under(p, c) for p in differs)]
    return out


def chain() -> list[Path]:
    """The chain from the `first` step, in order. It is a line: every step has at most one child."""
    steps = every_step()
    firsts = [s for s in steps if config_of(s).get('first')]
    if len(firsts) > 1:
        sys.exit(f'✗ more than one "first" step: {[name_of(s) for s in firsts]}')
    children: dict[str, list[Path]] = {}
    for s in steps:
        if config_of(s).get('from'):
            children.setdefault(config_of(s)['from'], []).append(s)
    for parent, kids in children.items():
        if len(kids) > 1:
            sys.exit(f'✗ {parent} has {len(kids)} children ({[name_of(k) for k in kids]}): the chain is a line')
    out = firsts[:1]
    while out and name_of(out[-1]) in children:
        out.append(children[name_of(out[-1])][0])
    return out


def lineage_of(step: Path) -> list[Path]:
    """The step and every ancestor through `from`, oldest first."""
    out = [step]
    while config_of(out[0]).get('from'):
        out.insert(0, ROOT / config_of(out[0])['from'])
    return out


def key_of(step: Path) -> str:
    """A step's KEY: its step.json, files and typed commands, and every ancestor's files and RECORDED
    transcript (what the step started from). A local step adds sun_gen's source: its data is
    the generator's. Not scripts/: improving the machine forces no re-write."""
    h = hashlib.sha256()
    chain = lineage_of(step)
    for s in chain:
        h.update(name_of(s).encode() + b'\0' + (s / 'step.json').read_bytes())
        for path, data in files(s).items():
            h.update(path.encode() + b'\0' + hashlib.sha256(data).digest())
        session = (s / 'session.txt').read_text() if (s / 'session.txt').exists() else ''
        h.update((session if s != step else '\n'.join(commands(session))).encode())
    if not config_of(step).get('gcp'):
        for p in sorted((REPO / 'sun_gen').glob('*.py')):
            h.update(p.read_bytes())
    return h.hexdigest()


def state_parent(step: Path) -> Path | None:
    """The local step whose saved state this step starts from: the nearest ancestor that is local
    and not a branch (a GCP step leaves local state as it found it; a branch is put back)."""
    for s in reversed(lineage_of(step)[:-1]):
        if not config_of(s).get('gcp') and not config_of(s).get('branch'):
            return s
    return None


# ── the machine ───────────────────────────────────────────────────────────────────────────────────

def run(args: list[str], **kw) -> subprocess.CompletedProcess:
    r = subprocess.run(args, capture_output=True, text=True, **kw)
    if r.returncode:
        sys.exit(f'✗ `{" ".join(args)}` failed:\n{r.stdout}{r.stderr}')
    return r


def admin(sql: str, db: str = 'postgres') -> str:
    return run(['runuser', '-u', 'postgres', '--', 'psql', '-X', '-q', '-At', '-h', '/tmp', '-v', 'ON_ERROR_STOP=1', '-d', db, '-c', sql]).stdout


def environment() -> dict:
    keep = {k: v for k, v in os.environ.items() if k in ('LANG', 'LC_ALL', 'TZ', 'HTTPS_PROXY', 'HTTP_PROXY', 'NO_PROXY',
                                                        'https_proxy', 'http_proxy', 'no_proxy', 'SSL_CERT_FILE',
                                                        'REQUESTS_CA_BUNDLE', 'PIP_INDEX_URL', 'PIP_CERT',
                                                        'NODE_EXTRA_CA_CERTS')}
    for k in ('SSL_CERT_FILE', 'REQUESTS_CA_BUNDLE', 'PIP_CERT', 'NODE_EXTRA_CA_CERTS'):
        # A proxy's CA bundle under /root is unreadable to priya: the replay hands her a copy
        if os.environ.get(k) and Path(os.environ[k]).is_file():
            copy = SPINE_ROOT / 'ca-bundle.crt'
            if not copy.exists():
                shutil.copy(os.environ[k], copy)
                copy.chmod(0o644)
            keep[k] = str(copy)
    return {**keep, 'HOME': str(HOME), 'USER': USER, 'LOGNAME': USER, 'PATH': '/usr/local/bin:/usr/bin:/bin',
            'TERM': 'dumb', 'NO_COLOR': '1', 'PYTHON_COLORS': '0', 'PS1': '', 'PGHOST': '/tmp',
            'PIP_DISABLE_PIP_VERSION_CHECK': '1', 'PSQLRC': '/dev/null', 'PAGER': 'cat', 'PSQL_PAGER': 'cat',
            'PIP_CACHE_DIR': str(SPINE_ROOT / 'pip-cache'), 'COLUMNS': '80', 'TZ': 'UTC',
            # gcloud: its own config dir per chain, no prompts, no survey, no update nag, no colour
            'CLOUDSDK_CONFIG': str(HOME / '.config' / 'gcloud'), 'CLOUDSDK_CORE_DISABLE_PROMPTS': '1',
            'CLOUDSDK_SURVEY_DISABLE_PROMPTS': '1', 'CLOUDSDK_COMPONENT_MANAGER_DISABLE_UPDATE_CHECK': '1',
            'CLOUDSDK_CORE_DISABLE_COLOR': '1', 'CLOUDSDK_CORE_DISABLE_USAGE_REPORTING': '1',
            'CLOUDSDK_CORE_SHOW_STRUCTURED_LOGS': 'never',
            # a container's hostname resolves to loopback, which Spark warns about; a laptop's does not
            'SPARK_LOCAL_IP': '127.0.0.1',
            # Terraform one request at a time: the same order every recording. Invisible in every command.
            'TF_CLI_ARGS_plan': '-parallelism=1', 'TF_CLI_ARGS_apply': '-parallelism=1',
            'TF_CLI_ARGS_destroy': '-parallelism=1'}


class Lake:
    """fake-gcs-server: the raw zone, emulated (Cloud Storage's JSON API). One per chain, fresh at
    its start, holding the buckets infra/ makes on GCP — empty."""

    def __init__(self) -> None:
        self.dir = SPINE_ROOT / 'gcs'
        self.proc: subprocess.Popen | None = None

    def start(self) -> None:
        import socket
        try:  # another server on the port would take this chain's writes: refuse, never share
            socket.create_connection(('127.0.0.1', GCS_PORT), timeout=0.2).close()
            sys.exit(f'✗ something is already listening on :{GCS_PORT} — stop it first')
        except OSError:
            pass
        self.dir.mkdir(parents=True, exist_ok=True)
        for b in BUCKETS:  # the filesystem backend: a folder per bucket
            (self.dir / b).mkdir(exist_ok=True)
        self.proc = subprocess.Popen(['fake-gcs-server', '-scheme', 'http', '-host', '127.0.0.1', '-port', str(GCS_PORT),
                                      '-backend', 'filesystem', '-filesystem-root', str(self.dir),
                                      '-public-host', f'127.0.0.1:{GCS_PORT}', '-log-level', 'error'],
                                     stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        for _ in range(100):
            try:
                socket.create_connection(('127.0.0.1', GCS_PORT), timeout=0.2).close()
                return
            except OSError:
                time.sleep(0.1)
        sys.exit('✗ fake-gcs-server did not start')

    def stop(self) -> None:
        if self.proc:
            self.proc.terminate()
            self.proc.wait()
            self.proc = None

    def reset(self) -> None:
        self.stop()
        shutil.rmtree(self.dir, ignore_errors=True)
        self.start()


def generated(part: str) -> Path:
    """sun_gen's output for a part, generated once per generator source."""
    h = hashlib.sha256()
    for p in sorted((REPO / 'sun_gen').glob('*.py')):
        h.update(p.read_bytes())
    cache = SPINE_ROOT / 'data' / h.hexdigest()[:16]
    if not cache.exists():
        tmp = cache.with_suffix('.tmp')
        shutil.rmtree(tmp, ignore_errors=True)
        run([PYTHON, '-m', 'sun_gen', '--out', str(tmp)], cwd=REPO)
        tmp.rename(cache)
    return cache / part


def lay(step: Path) -> None:
    """Lay the step's files over the working copy: a file it no longer has goes, run outputs stay."""
    want = files(step)
    if WORK.exists():
        for p in sorted(WORK.rglob('*'), reverse=True):
            rel = p.relative_to(WORK)
            if IGNORED & set(rel.parts):
                continue
            if p.is_file() and rel.as_posix() not in want:
                p.unlink()
            elif p.is_dir() and not any(p.iterdir()):
                p.rmdir()
    for path, data in want.items():
        target = WORK / path
        target.parent.mkdir(parents=True, exist_ok=True)
        if not target.exists() or target.read_bytes() != data:
            target.write_bytes(data)
    for part in config_of(step).get('generated', []):
        # the source systems' extracts and the vendors' files: Priya's local copy (data/, not committed)
        shutil.copytree(generated(part), WORK / 'data' / part, dirs_exist_ok=True)
    run(['chown', '-R', f'{USER}:{USER}', str(WORK)])


def venv(env: dict) -> dict:
    """The project's .venv for its requirements.txt: built silently once, parked when it changes."""
    req = WORK / 'requirements.txt'
    if not req.exists():
        sys.exit('✗ "venv": true needs a requirements.txt')
    key = hashlib.sha256(req.read_bytes()).hexdigest()[:16]
    stamp = WORK / '.venv' / '.spine-key'
    if not (stamp.exists() and stamp.read_text() == key):
        if (WORK / '.venv').exists():
            old = (stamp.read_text() if stamp.exists() else 'unknown')
            parked = SPINE_ROOT / 'venvs' / old
            shutil.rmtree(parked, ignore_errors=True)
            parked.parent.mkdir(parents=True, exist_ok=True)
            (WORK / '.venv').rename(parked)
        parked = SPINE_ROOT / 'venvs' / key
        if parked.exists():
            parked.rename(WORK / '.venv')
        else:
            as_user(f'{PYTHON} -m venv .venv && .venv/bin/pip install -q -r requirements.txt', env, check=True)
            (WORK / '.venv' / '.spine-key').write_text(key)
    return {**env, 'VIRTUAL_ENV': str(WORK / '.venv'), 'PATH': f"{WORK / '.venv' / 'bin'}:{env['PATH']}"}


def as_user(script: str, env: dict, check: bool = False) -> subprocess.CompletedProcess:
    r = subprocess.run(['runuser', '-u', USER, '--', 'env', '-i', *[f'{k}={v}' for k, v in env.items()], 'bash', '-c', script],
                       cwd=WORK, capture_output=True, text=True)
    if check and r.returncode:
        sys.exit(f'✗ `{script}` failed:\n{r.stdout}{r.stderr}')
    return r


def wrap(text: str, columns: int) -> str:
    rows = []
    for line in text.split('\n'):
        rows += [line[i:i + columns] for i in range(0, len(line), columns)] or ['']
    return '\n'.join(rows)


def session_of(step: Path, env: dict, normalise=None) -> tuple[str, dict[str, str], str]:
    """Run the step's setup silently, then its commands one by one, in ONE shell's state. Returns the
    transcript (normalised BEFORE it is wrapped: a wrapped id is an id split in two), the captures, and
    the raw unwrapped output, which a recording scans for leaks."""
    config = config_of(step)
    if config.get('venv'):
        env = venv(env)
    env_file = config.get('env')
    prelude = f'source {"env.sh" if env_file is True else env_file}\n' if env_file else ''
    for cmd in config.get('setup', []):
        r = as_user(prelude + cmd, env)
        if r.returncode:
            sys.exit(f'✗ {name_of(step)}: setup `{cmd}` failed:\n{r.stdout}{r.stderr}')
    cwd, blocks, columns, raw = WORK, [], config.get('columns', 80), []
    normalise = normalise or (lambda s: s)
    # One terminal's state across commands that each run in their own bash: the profile (prelude),
    # then every variable a typed command set (`ID=$(…)`, `URL=…`), saved after it and sourced before
    # the next. The names bash starts with are the baseline; only new ones are carried.
    state, saved = SPINE_ROOT / 'shell-state', SPINE_ROOT / 'shell-vars'
    state.write_text(prelude)
    saved.write_text('')
    baseline = SPINE_ROOT / 'shell-baseline'
    baseline.write_text(as_user(f'source {state} >/dev/null 2>&1; compgen -v | sort', env).stdout)
    for f in (state, saved, baseline):
        run(['chmod', '666', str(f)])
    typed = commands((step / 'session.txt').read_text())
    for cmd in typed:  # before ANY runs: a GCP command must not run for a step that cannot record
        if len(cmd) + 2 > columns:  # a wrapped command would read back as a shorter one
            sys.exit(f'✗ {name_of(step)}: `$ {cmd[:40]}…` is {len(cmd) + 2} columns; the pane holds {columns}')
    for cmd in typed:
        script = (f'source {state}\nsource {saved}\ncd {cwd}\n{{ {cmd}\n}} 2>&1\necho "{MARK}$PWD"\n'
                  f'new=$(comm -13 {baseline} <(compgen -v | sort) | grep -vx "new\\|BASH_.*\\|_" )\n'
                  f'[ -n "$new" ] && declare -p $new 2>/dev/null > {saved}.tmp && mv {saved}.tmp {saved}\n')
        r = as_user(script, env)
        output, _, after = (r.stdout + r.stderr).partition(MARK)
        if after:
            cwd = Path(after.split('\n')[0])
        output = ANSI.sub('', output).rstrip('\n')
        output = '\n'.join(line.rstrip() for line in output.split('\n'))
        raw.append(output)
        output = normalise(output)
        blocks.append(wrap(f'$ {cmd}', columns) + (f'\n{wrap(output, columns)}' if output else ''))
    captured = {}
    for name in config.get('capture', []):
        if name.startswith('gs://'):  # an object, read back from the raw zone after the session
            tmp = SPINE_ROOT / 'capture.tmp'
            as_user(prelude + f'gcloud storage cat "{name}" > {tmp}', env, check=True)
            captured[name[5:]] = tmp.read_text()
            tmp.unlink()
        else:
            captured[name] = (WORK / name).read_text()
    captured = {k: normalise(v) for k, v in captured.items()}
    return '\n'.join(blocks).rstrip('\n') + '\n', captured, '\n'.join(raw)


def masked(text: str, step: Path) -> str:
    kinds = config_of(step).get('volatile')
    if not kinds:
        return text
    kinds = {'uuid', 'hex', 'digits'} if kinds is True else set(kinds)
    if 'uuid' in kinds:
        text = UUID.sub('<uuid>', text)
    if 'hex' in kinds:
        text = re.sub(r'0x[0-9a-f]+', '0x#', text)
    return re.sub(r' *\d+(?:[.,]\d+)*', ' #', text) if 'digits' in kinds else text


class Snapshot:
    """A branch's state, put back after it: working copy (not .venv), databases, raw zone."""

    def __init__(self, lake: Lake) -> None:
        self.lake, self.dir = lake, SPINE_ROOT / 'branch'
        shutil.rmtree(self.dir, ignore_errors=True)
        shutil.copytree(WORK, self.dir / 'work', symlinks=True, ignore=shutil.ignore_patterns('.venv'))
        for db in DBS:
            admin(f'DROP DATABASE IF EXISTS {db}_saved')
            admin(f'CREATE DATABASE {db}_saved TEMPLATE {db}')
        lake.stop()
        shutil.copytree(lake.dir, self.dir / 'gcs')
        lake.start()

    def restore(self) -> None:
        for p in WORK.iterdir():
            if p.name != '.venv':
                shutil.rmtree(p) if p.is_dir() and not p.is_symlink() else p.unlink()
        shutil.copytree(self.dir / 'work', WORK, symlinks=True, dirs_exist_ok=True)
        for db in DBS:
            admin(f'DROP DATABASE {db}')
            admin(f'ALTER DATABASE {db}_saved RENAME TO {db}')
        self.lake.stop()
        shutil.rmtree(self.lake.dir)
        shutil.copytree(self.dir / 'gcs', self.lake.dir)
        self.lake.start()


def fresh(lake: Lake) -> None:
    """A new chain (or lab): an empty working copy, empty databases, an empty raw zone."""
    if WORK.exists():
        for p in WORK.iterdir():
            if p.name != '.venv':
                shutil.rmtree(p) if p.is_dir() and not p.is_symlink() else p.unlink()
    WORK.mkdir(parents=True, exist_ok=True)
    shutil.rmtree(HOME / '.config' / 'gcloud', ignore_errors=True)
    for db in DBS:
        admin(f'DROP DATABASE IF EXISTS {db}')
        admin(f'DROP DATABASE IF EXISTS {db}_saved')
        admin(f'CREATE DATABASE {db} OWNER {USER}')
    lake.reset()


# ── saved state: one local step at a time ──────────────────────────────────────────────────────────

def _tar(src: Path, dest: Path, skip: set[str] = frozenset()) -> None:
    import tarfile
    # Anything named in IGNORED that can hold a real id (Terraform's state) stays out at any depth
    secret = {'.terraform', 'terraform.tfstate', 'terraform.tfstate.backup', 'tfplan'}
    with tarfile.open(dest, 'w:gz') as tar:
        for p in sorted(src.iterdir()):
            if p.name not in skip:
                tar.add(p, arcname=p.name, filter=lambda info: None if secret & set(Path(info.name).parts) else info)


def _untar(src: Path, dest: Path) -> None:
    import tarfile
    with tarfile.open(src) as tar:
        tar.extractall(dest, filter='tar')


def save_state(step: Path, lake: Lake) -> None:
    import gzip
    d = step / 'state'
    shutil.rmtree(d, ignore_errors=True)
    d.mkdir()
    for db in DBS:
        dump = run(['runuser', '-u', 'postgres', '--', 'pg_dump', '-h', '/tmp', '--no-owner', '--no-privileges', db]).stdout
        with gzip.GzipFile(d / f'db-{db}.sql.gz', 'wb', mtime=0) as f:
            f.write(dump.encode())
    lake.stop()
    # fake-gcs-server keeps each object's metadata in an extended attribute (user.metadata): an
    # archive without it restores files the server no longer lists. GNU tar keeps xattrs; tarfile does not.
    run(['tar', '--xattrs', '--xattrs-include=user.*', '--sort=name', '--mtime=2026-10-31 00:00Z', '--owner=0', '--group=0',
         '--numeric-owner', '-czf', str(d / 'gcs.tar.gz'), '-C', str(lake.dir), '.'])
    lake.start()
    _tar(WORK, d / 'work.tar.gz', skip={'.venv', 'data'})


def restore_state(step: Path | None, lake: Lake) -> None:
    """Empty databases, raw zone and working copy; then, if there is a step, exactly what it left."""
    import gzip
    fresh(lake)
    if step is None:
        return
    d = step / 'state'
    for db in DBS:
        sql = gzip.decompress((d / f'db-{db}.sql.gz').read_bytes()).decode()
        r = subprocess.run(['runuser', '-u', USER, '--', 'psql', '-X', '-q', '-h', '/tmp', '-v', 'ON_ERROR_STOP=1', '-d', db],
                           input=sql, capture_output=True, text=True)
        if r.returncode:
            sys.exit(f'✗ restoring {name_of(step)}\'s {db} database failed:\n{r.stderr}')
    lake.stop()
    shutil.rmtree(lake.dir, ignore_errors=True)
    lake.dir.mkdir(parents=True)
    run(['tar', '--xattrs', '--xattrs-include=user.*', '-xzf', str(d / 'gcs.tar.gz'), '-C', str(lake.dir)])
    lake.start()
    _untar(d / 'work.tar.gz', WORK)
    # data/ is not archived (the day's viewing events alone are ~100 MB): sun_gen's parts every step
    # up to here asked for, from the generator's cache
    for part in sorted({p for s in lineage_of(step) for p in config_of(s).get('generated', [])}):
        shutil.copytree(generated(part), WORK / 'data' / part, dirs_exist_ok=True)
    run(['chown', '-R', f'{USER}:{USER}', str(WORK)])


def write_local(step: Path, lake: Lake) -> None:
    parent = state_parent(step)
    if parent is not None and not recorded_ok(parent)[0]:
        sys.exit(f'✗ {name_of(step)} starts from {name_of(parent)}, which is {recorded_ok(parent)[1]}')
    restore_state(parent, lake)
    lay(step)
    transcript, captured, _ = session_of(step, environment())
    (step / 'session.txt').write_text(transcript)
    for file, text in captured.items():
        (step / 'captured' / file).parent.mkdir(parents=True, exist_ok=True)
        (step / 'captured' / file).write_text(text)
    if config_of(step).get('branch'):
        shutil.rmtree(step / 'state', ignore_errors=True)
    else:
        save_state(step, lake)
    (step / 'recorded.json').write_text(json.dumps({'key': key_of(step), 'transcript': hashlib.sha256(transcript.encode()).hexdigest()},
                                                   indent=2) + '\n')
    print(f'wrote {name_of(step)}{" (a branch: no state saved)" if config_of(step).get("branch") else ""}')


# ── recording a GCP step ──────────────────────────────────────────────────────────────────────────
#
# NOT YET RUN against a real project (written with the pilot, before the recording secrets existed):
# the first --record is its test. Read every transcript it writes before committing it, and run
# scripts/leaks.py.

FACTS = {  # COURSE-PLAN.md, "Facts": what a real value is shown as
    'project': 'sun-media-dev',
    'number': '100000000001',
    'account': 'priya@sun.example',
    'billing': '000000-000000-000001',
    'host': 'priya-laptop',
}
TRANSPORT = ('Connection reset by peer', 'connection reset by peer', 'i/o timeout', 'TLS handshake timeout',
             'RemoteDisconnected', 'Connection aborted', 'ServiceUnavailable', '503 Service Unavailable')
SECRETS = ('GOOGLE_PROJECT_ID', 'GOOGLE_CREDENTIALS')  # and GOOGLE_BILLING_ACCOUNT for §3.8's budget

# The last moment in Sun's data (sun_gen's RERATE_AT, §5.5's race): every timestamp at or before it is
# the business's own and is never shifted; a recording happens after it.
from datetime import datetime as _dt
BUSINESS_END = _dt(2026, 11, 1, 2, 0, 4)


class Normaliser:
    """Real ids, hosts, emails and timestamps → the values in COURSE-PLAN.md, "Facts". Every other long
    numeric id (an object generation, a job or operation id) becomes a stable placeholder of the same
    length in order of first appearance; every other GUID likewise; timestamps keep their spacing
    from a fixed clock. `refuse` lists every fragment of a known real value still in the text."""

    CLOCK = '2026-11-01T09:30:00'
    ISO = re.compile(r'\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?')
    LONG = re.compile(r'(?<![\d.])\d{13,20}(?![\d.])')

    def __init__(self, real: dict[str, str], names: dict[str, str]) -> None:
        self.real = {k: v for k, v in real.items() if v and v.lower() != 'none'}
        self.names = names  # real resource name → shown name (a bucket's global suffix)
        self.ids: dict[str, str] = {}
        self.guids: dict[str, str] = {}
        self.t0 = None

    def __call__(self, text: str) -> str:
        # What was TYPED is never rewritten (the step's key hashes it); only what GCP printed
        return '\n'.join(line if line.startswith('$ ') else self.output(line) for line in text.split('\n'))

    def output(self, text: str) -> str:
        from datetime import datetime
        for real, shown in self.names.items():
            text = text.replace(real, shown)
        for kind in ('account', 'billing', 'host', 'project', 'number'):  # the account's email holds the project id
            if self.real.get(kind):
                text = re.sub(re.escape(self.real[kind]), FACTS[kind], text, flags=re.I)

        def long_id(m: re.Match) -> str:
            v = m.group(0)
            if v in FACTS.values():
                return v
            return self.ids.setdefault(v, str(10 ** (len(v) - 1) + len(self.ids) + 1))
        text = self.LONG.sub(long_id, text)

        def guid(m: re.Match) -> str:
            g = m.group(0).lower()
            return g if g.startswith('00000000-0000-0000-0000-') else \
                self.guids.setdefault(g, f'00000000-0000-0000-0000-{0x1000 + len(self.guids):012x}')
        text = UUID.sub(guid, text)

        def stamp(m: re.Match) -> str:
            raw = m.group(0)
            t = datetime.fromisoformat(raw.replace('Z', '+00:00').replace(' ', 'T')).replace(tzinfo=None)
            if t <= BUSINESS_END:  # Sun's own time (a window end, a watermark): data, not a clock
                return raw
            self.t0 = self.t0 or t
            shown = (datetime.fromisoformat(self.CLOCK) + (t - self.t0)).isoformat(timespec='seconds')
            return shown.replace('T', ' ') if ' ' in raw[10:11] else shown + ('Z' if raw.endswith('Z') else '')
        text = self.ISO.sub(stamp, text)
        # an email that is not Sun's, a household's (mail.example) or a service account's
        # a person's email that is not Sun's or a household's. Google's own accounts (any
        # *gserviceaccount.com: service agents, appspot, cloudservices) stay: their project part
        # is already normalised above
        return re.sub(r'[\w.+-]+@(?!sun\.example|mail\.example|([\w-]+\.)*gserviceaccount\.com)[\w-]+(\.[\w-]+)+',
                      FACTS['account'], text)

    def refuse(self, text: str) -> list[str]:
        # Searched as written and with every line break removed (a wrapped id)
        text = '\n'.join([text, text.replace('\n', '')]).lower()
        return [f'the real {kind}' for kind, value in self.real.items()
                if len(value) >= 6 and value.lower() != FACTS.get(kind, '').lower() and value.lower() in text]


def recorder() -> tuple[dict, 'Normaliser']:
    """The recording sign-in (the service account, silently) and its normaliser."""
    SPINE_ROOT.mkdir(parents=True, exist_ok=True)
    rec = SPINE_ROOT / 'gcp-record'
    rec.mkdir(exist_ok=True)
    key = rec / 'key.json'  # outside the project, never printed, never committed
    key.write_text(os.environ['GOOGLE_CREDENTIALS'])
    key.chmod(0o600)
    run(['chown', '-R', f'{USER}:{USER}', str(SPINE_ROOT)])
    project = os.environ['GOOGLE_PROJECT_ID']
    env = {**environment(), 'CLOUDSDK_CONFIG': str(rec / 'gcloud'), 'CLOUDSDK_CORE_PROJECT': project,
           'GOOGLE_APPLICATION_CREDENTIALS': str(key), 'GOOGLE_CLOUD_PROJECT': project}
    r = as_user(f'gcloud auth activate-service-account --key-file={key} --quiet >/dev/null 2>&1', env)
    if r.returncode:
        sys.exit('✗ gcloud auth failed (the output is not printed: it may hold a secret)')
    account = json.loads(os.environ['GOOGLE_CREDENTIALS']).get('client_email', '')
    number = as_user(f'gcloud projects describe {project} --format="value(projectNumber)"', env).stdout.strip()
    import socket
    real = {'project': project, 'number': number, 'account': account, 'host': socket.gethostname(),
            'billing': os.environ.get('GOOGLE_BILLING_ACCOUNT', ''),
            'client': json.loads(os.environ['GOOGLE_CREDENTIALS']).get('client_id', '')}
    if os.environ.get('GOOGLE_BILLING_ACCOUNT'):  # §3.8's budget: gcp.sh hands it to Terraform
        env['GOOGLE_BILLING_ACCOUNT'] = os.environ['GOOGLE_BILLING_ACCOUNT']
    suffix = os.environ.get('GCS_SUFFIX', '')  # bucket names are global: the owner's may carry a suffix
    names = {f'{b}{suffix}': b for b in BUCKETS + ('sun-media-dev-tfstate',)} if suffix else {}
    return env, Normaliser(real, names)


def undo(step: Path, command: str) -> int:
    """--undo <step> '<command>': run one off-screen command as the recorder, in the step's own
    working copy (`source gcp.sh` first), printing its output normalised. For putting the project
    back as a step's PARENT left it before recording the step again: `terraform destroy -target=…`."""
    env, norm = recorder()
    lay(step)
    r = as_user(f'source gcp.sh >/dev/null 2>&1; cd infra && terraform init -input=false '
                f'-backend-config=bucket=$TF_VAR_project_id-tfstate >/dev/null 2>&1; {command} 2>&1', env)
    print(norm.output(ANSI.sub('', r.stdout + r.stderr))[-4000:])
    return r.returncode


def record(step: Path) -> int:
    config = config_of(step)
    if not config.get('gcp'):
        sys.exit(f'✗ {name_of(step)} is a local step: it is replayed, not recorded')
    missing = [s for s in SECRETS if not os.environ.get(s)]
    if missing:
        sys.exit(f'✗ recording needs the environment secrets {", ".join(missing)} (CLAUDE.md, "Identity")')
    if shutil.which('gcloud') is None or shutil.which('terraform') is None:
        sys.exit('✗ gcloud and terraform are needed: scripts/install-gcp-tools.sh')
    for parent in lineage_of(step)[:-1]:
        if config_of(parent).get('gcp') and not recorded_ok(parent)[0]:
            sys.exit(f'✗ {name_of(parent)} is not recorded and current: record the course in order')
    env, norm = recorder()
    lake = None
    if config.get('local_state'):  # a GCP step that also reads the source systems (§5.6)
        parent = state_parent(step)
        if parent is None or not recorded_ok(parent)[0]:
            sys.exit(f'✗ {name_of(step)} needs its local parent\'s saved state, written and current')
        lake = Lake()
        restore_state(parent, lake)
    try:
        lay(step)
        transcript, captured, raw = session_of(step, env, normalise=norm.output)
    finally:
        if lake:
            lake.stop()
    leaks = norm.refuse(transcript + '\n'.join(captured.values()))
    flaky = [m for m in TRANSPORT if m in transcript]
    if flaky:
        sys.exit(f'✗ {name_of(step)}: a transport failure ("{flaky[0]}") is in the transcript — nothing written; record it again')
    private = json.loads(os.environ['GOOGLE_CREDENTIALS']).get('private_key_id', '\0')
    if private in transcript:
        leaks.append('the key id')
    if leaks:
        sys.exit(f'✗ {name_of(step)}: the transcript still holds {", ".join(sorted(set(leaks)))} — nothing written')
    (step / 'session.txt').write_text(transcript)
    for file, text in captured.items():
        (step / 'captured' / file).parent.mkdir(parents=True, exist_ok=True)
        (step / 'captured' / file).write_text(text)
    sdk = as_user('gcloud version --format="value(\'Google Cloud SDK\')"', env).stdout.strip()
    (step / 'recorded.json').write_text(json.dumps({'key': key_of(step), 'transcript': hashlib.sha256(transcript.encode()).hexdigest(),
                                                    'gcloud': sdk}, indent=2) + '\n')
    print(f'✓ recorded {name_of(step)}')
    return 0


def recorded_ok(step: Path) -> tuple[bool, str]:
    gcp = config_of(step).get('gcp')
    how = f'python scripts/spine.py {"--record" if gcp else "--write"} {name_of(step)}'
    rec = step / 'recorded.json'
    if not rec.exists():
        return False, f'not written yet ({how})'
    data = json.loads(rec.read_text())
    if data['key'] != key_of(step):
        return False, f'changed since it was written, or a step before it did ({how}, then every stale step after it)'
    if data['transcript'] != hashlib.sha256((step / 'session.txt').read_bytes()).hexdigest():
        return False, 'session.txt was edited by hand: a transcript is run, never typed'
    if not gcp and not config_of(step).get('branch') and not all((step / 'state' / f'db-{db}.sql.gz').exists() for db in DBS):
        return False, f'its saved state is missing ({how})'
    return True, ''


def teardown() -> int:
    """After a course: `terraform destroy` of what infra/ made (COURSE-PLAN.md, "The spine"). The
    state bucket stays: it is the one thing the project holds between recordings."""
    rec = SPINE_ROOT / 'gcp-record'
    env = {**environment(), 'CLOUDSDK_CONFIG': str(rec / 'gcloud'), 'GOOGLE_APPLICATION_CREDENTIALS': str(rec / 'key.json')}
    if not (WORK / 'infra' / 'main.tf').exists():
        print('· no infra/ in the working copy: nothing to destroy')
        return 0
    r = as_user('cd infra && terraform init -input=false >/dev/null && '
                'terraform destroy -var-file=envs/dev.tfvars -auto-approve -input=false >/dev/null', env)
    print('✓ terraform destroy' if r.returncode == 0 else f'✗ terraform destroy failed:\n{ANSI.sub("", r.stderr)[-2000:]}')
    return r.returncode and 1


# ── main ──────────────────────────────────────────────────────────────────────────────────────────

def preflight() -> str | None:
    if os.geteuid() != 0:
        return 'run as root: the replay drives the shell as priya and the server as postgres'
    if run([PYTHON, '-c', 'import platform; print("Python " + platform.python_version())']).stdout.strip() != PINNED:
        return f'{PYTHON} is not {PINNED}: run scripts/install-toolchain.sh'
    major = admin('SHOW server_version_num')
    if int(major) // 10000 != PG_MAJOR:
        return f'PostgreSQL is {major}, not {PG_MAJOR}: run scripts/setup-postgres.sh'
    if shutil.which('fake-gcs-server') is None:
        return 'fake-gcs-server is not installed: run scripts/install-gcp-tools.sh'
    if shutil.which('gcloud') is None:
        return 'gcloud is not installed (the local steps list the raw zone with it)'
    return None


def main(argv: list[str]) -> int:
    if '--record' in argv:
        return record(ROOT / argv[argv.index('--record') + 1])
    if '--undo' in argv:
        i = argv.index('--undo')
        return undo(ROOT / argv[i + 1], argv[i + 2])
    if '--teardown' in argv:
        return teardown()
    write, replay = '--write' in argv, '--replay' in argv
    only = [a for a in argv if not a.startswith('--')]
    asked = lambda s: not only or any(name_of(s).startswith(o) for o in only)
    problems = [p for s in every_step() for p in lineage(s)]
    line = chain()
    labs = [s for s in every_step() if config_of(s).get('lab')]
    problems += [f'{name_of(s)}: not on the chain from the first step' for s in every_step() if s not in line and s not in labs]
    for p in problems:
        print(f'✗ {p}')
    if problems and (write or replay):
        print('✗ the chain is broken: fix step.json or the snapshots first')
        return 1
    ordered = line + labs
    if not write and not replay:  # the check: runs nothing
        for step in (s for s in ordered if asked(s)):
            ok, why = recorded_ok(step)
            kind = 'GCP' if config_of(step).get('gcp') else 'local'
            print(f'{"✓" if ok else "✗"} {name_of(step)} ({kind}){"" if ok else ": " + why}')
            problems += [] if ok else [f'{name_of(step)}: {why}']
        print(f"{'✗' if problems else '✓'} {sum(map(asked, ordered))} step(s) checked, {len(problems)} problem(s)")
        return 1 if problems else 0
    problem = preflight()
    if problem:
        print(f'✗ {problem}')
        return 1
    SPINE_ROOT.mkdir(parents=True, exist_ok=True)
    (SPINE_ROOT / 'pip-cache').mkdir(exist_ok=True)
    run(['chown', f'{USER}:{USER}', str(SPINE_ROOT), str(SPINE_ROOT / 'pip-cache')])
    lake = Lake()
    try:
        if write:
            for step in (s for s in ordered if asked(s)):
                if config_of(step).get('gcp'):
                    print(f'· {name_of(step)} is a GCP step: --record it')
                    continue
                write_local(step, lake)
            return 0
        # --replay: the whole local chain from its start (labs alone), compared with what was written
        for group in [line] + [[lab] for lab in labs]:
            wanted = [s for s in group if asked(s)]
            if not wanted:
                continue
            fresh(lake)
            for step in group[:group.index(wanted[-1]) + 1]:
                config = config_of(step)
                if config.get('gcp'):
                    continue
                lay(step)
                snap = Snapshot(lake) if config.get('branch') else None
                transcript, captured, _ = session_of(step, environment())
                if snap:
                    snap.restore()
                if not asked(step):
                    continue
                before = len(problems)
                expected = (step / 'session.txt').read_text()
                if masked(transcript, step) != masked(expected, step):
                    problems.append(f'{name_of(step)}: the terminal pane differs from a real run')
                    sys.stdout.writelines(difflib.unified_diff(expected.splitlines(True), transcript.splitlines(True), 'session.txt', 'real run'))
                for file, text in captured.items():
                    if not (step / 'captured' / file).exists() or (step / 'captured' / file).read_text() != text:
                        problems.append(f'{name_of(step)}: captured/{file} differs from a real run')
                print(f'{"✗" if len(problems) > before else "✓"} {name_of(step)}')
    finally:
        lake.stop()
    print(f"{'✗' if problems else '✓'} replayed, {len(problems)} problem(s)")
    return 1 if problems else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))

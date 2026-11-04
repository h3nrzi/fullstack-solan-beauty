"""Disposable, synthetic validation. Uses only stdlib and existing PostgreSQL tools."""
import concurrent.futures
import hashlib
import http.server
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import threading
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone

HERE = Path(__file__).resolve().parent
START = time.monotonic()
REPORT = {"started_utc": datetime.now(timezone.utc).isoformat(), "synthetic_only": True,
          "cash_purchase_toman": 0, "commands": [], "tests": []}
DB = "wf_synthetic"
ROOT = None
ENV = None


def command(args, input=None, check=True):
    start = time.monotonic()
    p = subprocess.run(args, input=input, text=True, capture_output=True, env=ENV, timeout=40)
    REPORT["commands"].append({"argv": args, "returncode": p.returncode,
        "stdout": p.stdout, "stderr": p.stderr, "stdin": input, "seconds": time.monotonic()-start})
    if check and p.returncode:
        raise RuntimeError(p.stderr)
    return p


def sql(query, check=True, db=None):
    return command(["psql", "-X", "-qAt", "-v", "ON_ERROR_STOP=1", "-d", db or DB], query, check)


def value(query, db=None):
    return sql(query, db=db).stdout.strip()


def expect(condition, detail):
    if not condition:
        raise AssertionError(detail)


def test(name, fn):
    start = time.monotonic()
    try:
        evidence = fn()
        REPORT["tests"].append({"name": name, "status": "تأییدشده با آزمون",
                                "seconds": time.monotonic()-start, "evidence": evidence})
    except Exception as exc:
        REPORT["tests"].append({"name": name, "status": "ردشده با شواهد",
                                "seconds": time.monotonic()-start, "error": repr(exc)})
        raise


def parallel(queries):
    gate = threading.Barrier(len(queries))
    def run(q):
        gate.wait(timeout=10)
        return sql(q, check=False)
    with concurrent.futures.ThreadPoolExecutor(max_workers=len(queries)) as pool:
        return list(pool.map(run, queries))


def launch(query):
    p = subprocess.Popen(["psql", "-X", "-qAt", "-v", "ON_ERROR_STOP=1", "-d", DB],
        stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, env=ENV)
    p.stdin.write(query)
    p.stdin.close()
    p.stdin = None
    p.validation_query = query
    return p


def finish(p):
    out, err = p.communicate(timeout=25)
    REPORT["commands"].append({"argv": ["psql", "async"], "returncode": p.returncode,
                                "stdout": out, "stderr": err, "stdin": p.validation_query})
    return p.returncode, out, err


def wait_sleep(app):
    # Wait for a specific backend to hold its transaction open, not a timing guess.
    deadline = time.monotonic()+10
    while time.monotonic() < deadline:
        if value(f"SELECT count(*) FROM pg_stat_activity WHERE application_name='{app}' AND wait_event='PgSleep'") == "1":
            return
        time.sleep(.03)
    raise TimeoutError(app)


def capacity_one():
    p = launch("SET application_name='wf_capacity'; BEGIN; INSERT INTO allocation(booking,unit,span) VALUES('a','artist','[0,60)'); SELECT pg_sleep(2); COMMIT;")
    wait_sleep("wf_capacity")
    loser = sql("INSERT INTO allocation(booking,unit,span) VALUES('b','artist','[30,90)')", False)
    rc, _, _ = finish(p)
    expect(rc == 0 and loser.returncode != 0 and "exclusion constraint" in loser.stderr, "winner/loser mismatch")
    sql("INSERT INTO allocation(booking,unit,span) VALUES('adjacent','artist','[60,90)')")
    expect(value("SELECT count(*) FROM allocation WHERE unit='artist'") == "2", "boundary mismatch")
    return {"accepted_contenders": 1, "rejected_overlap": 1, "adjacent_accepted": 1}


def capacity_three():
    queries = []
    for i in range(4):
        queries.append(f"""BEGIN; DO $$ DECLARE u int; BEGIN
        PERFORM pg_advisory_xact_lock(440018);
        SELECT candidate.id INTO u FROM unit candidate WHERE NOT EXISTS(SELECT 1 FROM allocation a WHERE a.unit='chair:'||candidate.id AND a.span && '[0,60)'::int4range) ORDER BY candidate.id LIMIT 1;
        IF u IS NULL THEN RAISE EXCEPTION 'capacity exhausted'; END IF;
        INSERT INTO allocation(booking,unit,span) VALUES('chair-booking-{i}','chair:'||u,'[0,60)');
        PERFORM pg_sleep(.1); END $$; COMMIT;""")
    results = parallel(queries)
    expect(sum(p.returncode == 0 for p in results) == 3, "capacity three winners")
    expect(all(p.returncode == 0 or "capacity exhausted" in p.stderr for p in results), "unexpected rejection")
    expect(value("SELECT count(*) FROM allocation WHERE unit LIKE 'chair:%'") == "3", "chair rows")
    return {"connections": 4, "accepted": 3, "capacity_rejections": 1, "pattern": "serialized explicit unit allocation"}


def atomic_booking():
    sql("INSERT INTO allocation(booking,unit,span) VALUES('existing','last-resource','[0,60)')")
    p = sql("BEGIN; INSERT INTO allocation(booking,unit,span) VALUES('partial','new-artist','[0,60)'),('partial','first-resource','[0,20)'); INSERT INTO outbox(id) VALUES('partial'); INSERT INTO allocation(booking,unit,span) VALUES('partial','last-resource','[30,60)'); COMMIT;", False)
    expect(p.returncode != 0 and "exclusion constraint" in p.stderr, "failure not injected")
    expect(value("SELECT (SELECT count(*) FROM allocation WHERE booking='partial')+(SELECT count(*) FROM outbox WHERE id='partial')") == "0", "partial residue")
    return {"partial_allocations_and_events": 0}


def payments():
    results = parallel([f"SET application_name='notification-{i%2}'; SELECT receive_payment('synthetic','payment-1',100)" for i in range(10)])
    expect(all(p.returncode == 0 for p in results), "payment error")
    receipts = {p.stdout.strip() for p in results}
    expect(len(receipts) == 1, "unstable receipt")
    # Discard the response, then replay: models client response loss after known commit.
    sql("SELECT receive_payment('synthetic','payment-1',100)")
    expect(value("SELECT receive_payment('synthetic','payment-1',100)") in receipts, "replay receipt")
    mismatch = sql("SELECT receive_payment('synthetic','payment-1',101)", False)
    expect(mismatch.returncode != 0 and "payment amount mismatch" in mismatch.stderr, "amount mismatch accepted")
    expect(value("SELECT count(*) FROM payment") == "1", "duplicate financial effect")
    expect(value("SELECT count(*) FROM outbox") == "1", "duplicate outbox")
    return {"notifications": 10, "notification_ids": 2, "financial_effects": 1, "stable_receipt": list(receipts), "mismatched_amount_rejected": True}


def stock_atomicity():
    p = sql("SELECT complete_service('failure',true)", False)
    expect(p.returncode != 0 and "injected before commission" in p.stderr, "injection failed")
    expect(value("SELECT quantity FROM stock") == "1", "partial stock effect")
    expect(value("SELECT (SELECT count(*) FROM completion)+(SELECT count(*) FROM commission)") == "0", "partial completion")
    results = parallel(["SELECT complete_service('service-a',false)", "SELECT complete_service('service-b',false)"])
    expect(sum(p.returncode == 0 for p in results) == 1, "last stock winners")
    expect(all(p.returncode == 0 or "insufficient stock" in p.stderr for p in results), "unexpected stock failure")
    key = value("SELECT id FROM completion")
    sql(f"SELECT complete_service('{key}',false)")
    expect(value("SELECT quantity FROM stock") == "0", "stock mismatch")
    expect(value("SELECT count(*) FROM commission") == "1", "commission duplication")
    return {"failed_completion_residue": 0, "successful_completions": 1, "remaining_stock": 0, "commissions": 1}


def workers():
    sql("TRUNCATE outbox; INSERT INTO outbox(id) SELECT 'event-'||i FROM generate_series(1,21) i")
    expect(value("SELECT count(*) FROM outbox WHERE state='pending'") == "21", "offline backlog missing")
    p = launch("SET application_name='wf_crash'; BEGIN; SELECT id FROM outbox WHERE id='event-1' FOR UPDATE; INSERT INTO effect(id) VALUES('event-1'); UPDATE outbox SET state='done' WHERE id='event-1'; SELECT pg_sleep(12); COMMIT;")
    wait_sleep("wf_crash")
    sql("SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE application_name='wf_crash'")
    rc, _, err = finish(p)
    expect(rc != 0 and "terminating connection" in err, "worker not killed")
    expect(value("SELECT count(*) FROM effect") == "0", "uncommitted effect survived")
    expect(value("SELECT state FROM outbox WHERE id='event-1'") == "pending", "event lost on crash")
    batch = """BEGIN; WITH picked AS (SELECT id FROM outbox WHERE state='pending' ORDER BY id FOR UPDATE SKIP LOCKED LIMIT 1), applied AS (INSERT INTO effect(id) SELECT id FROM picked RETURNING id) UPDATE outbox SET state='done' WHERE id IN (SELECT id FROM applied); SELECT pg_sleep(.01); COMMIT;"""
    def worker(_):
        # One independent backend per worker; each event is a separate transaction.
        return sql(batch*21)
    started = time.monotonic()
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        list(pool.map(worker, range(2)))
    expect(value("SELECT count(*) FROM outbox WHERE state='done'") == "21", "lost events")
    expect(value("SELECT count(*) FROM effect") == "21", "duplicate/missing effects")
    sql("INSERT INTO outbox(id,state) VALUES('external-unknown','unknown')")
    sql(batch)
    expect(value("SELECT state FROM outbox WHERE id='external-unknown'") == "unknown", "unknown resent")
    return {"workers": 2, "events": 21, "effects": 21, "drain_seconds": time.monotonic()-started,
            "unknown_external_auto_retries": 0, "limitation": "local DB effects only; no actual external send"}


def private_files():
    private = ROOT / "private"
    private.mkdir(mode=0o700)
    f = private / "synthetic.bin"
    f.write_bytes(b"SYNTHETIC-NO-CUSTOMER-DATA")
    f.chmod(0o600)
    class Handler(http.server.BaseHTTPRequestHandler):
        def log_message(self, *args):
            pass

        def do_GET(self):
            # Tokens are fixed synthetic fixtures, never production credentials.
            token = self.headers.get("Authorization", "")
            allowed = False
            if self.path == "/media/1" and token in {"synthetic-owner", "synthetic-other", "synthetic-no-permission"}:
                allowed = value(f"SELECT count(*) FROM session s JOIN media m ON m.owner_id=s.owner_id WHERE s.token='{token}' AND s.active AND s.can_read AND m.id=1") == "1"
            self.send_response(200 if allowed else 403)
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            if allowed:
                self.wfile.write(f.read_bytes())
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    def request(token, path="/media/1"):
        req = urllib.request.Request(f"http://127.0.0.1:{server.server_port}{path}", headers={"Authorization": token})
        try:
            response = urllib.request.urlopen(req, timeout=10)
        except urllib.error.HTTPError as e:
            response = e
        with response:
            return response.status, response.headers.get("Cache-Control"), response.read().decode()
    try:
        before = request("synthetic-owner")
        expect(before == (200,"no-store","SYNTHETIC-NO-CUSTOMER-DATA"), "authorized fetch")
        denied = [request(""), request("synthetic-other"), request("synthetic-no-permission"), request("synthetic-owner", "/private/synthetic.bin")]
        sql("UPDATE session SET can_read=false WHERE token='synthetic-owner'")
        permission_revoked = request("synthetic-owner")
        expect(permission_revoked[0] == 403, "revoked permission retained")
        sql("UPDATE session SET can_read=true WHERE token='synthetic-owner'")
        expect(request("synthetic-owner")[0] == 200, "restored permission not applied")
        sql("UPDATE session SET active=false WHERE token='synthetic-owner'")
        after = request("synthetic-owner")
        expect(all(r[0] == 403 and r[1] == "no-store" for r in denied+[after]), "unauthorized file access")
        expect(f.stat().st_mode & 0o777 == 0o600 and private.stat().st_mode & 0o777 == 0o700, "filesystem modes")
        return {"before_revocation": before[0], "denied_statuses": [r[0] for r in denied], "permission_revoked": permission_revoked[0], "old_session_after_revocation": after[0], "cache_control": "no-store", "fixture_only": True}
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=5)


def digest(db):
    tables = value("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename", db).splitlines()
    rows = {t: value(f"SELECT coalesce(jsonb_agg(r ORDER BY r::text),'[]'::jsonb)::text FROM (SELECT to_jsonb(x) AS r FROM {t} x) q", db) for t in tables}
    sequences = value("SELECT sequencename||':'||last_value FROM pg_sequences WHERE schemaname='public' ORDER BY sequencename", db)
    data = json.dumps({"rows": rows, "sequences": sequences}, sort_keys=True).encode()
    return {"sha256": hashlib.sha256(data).hexdigest(), "table_rows": {t:len(json.loads(v)) for t,v in rows.items()}, "sequences": sequences}


def backup():
    before_restart = digest(DB)
    command(["pg_ctl", "-D", str(ROOT/"data"), "-m", "fast", "-w", "stop"])
    command(["pg_ctl", "-D", str(ROOT/"data"), "-l", str(ROOT/"postgres.log"), "-w", "start"])
    expect(digest(DB) == before_restart, "committed data lost after restart")
    archive = ROOT / "synthetic.dump"
    start = time.monotonic()
    command(["pg_dump", "-Fc", "-f", str(archive), "-d", DB])
    dump_seconds = time.monotonic()-start
    checksum = hashlib.sha256(archive.read_bytes()).hexdigest()
    # The only database removed is the one created in this fresh disposable cluster.
    sql(f"DROP DATABASE {DB}", db="postgres")
    sql("CREATE DATABASE wf_restored", db="postgres")
    start = time.monotonic()
    command(["pg_restore", "--exit-on-error", "-d", "wf_restored", str(archive)])
    restore_seconds = time.monotonic()-start
    restored = digest("wf_restored")
    expect(restored == before_restart, "restore digest mismatch")
    corrupt = ROOT / "corrupt.dump"
    corrupt.write_bytes(b"not-a-postgres-archive")
    p = command(["pg_restore", "--list", str(corrupt)], check=False)
    expect(p.returncode != 0, "corrupt archive accepted")
    return {"dump_seconds": dump_seconds, "restore_seconds": restore_seconds,
            "archive_sha256": checksum, "source": before_restart, "restored": restored,
            "corrupt_archive_rejected": True, "RTO_RPO_proven": False,
            "limitation": "same cluster logical restore; no PITR, host loss, media or production load"}


def main():
    global ROOT, ENV
    for tool in ("initdb", "pg_ctl", "psql", "pg_dump", "pg_restore"):
        if shutil.which(tool) is None:
            raise RuntimeError(f"Missing existing tool: {tool}; no installation authorized by this script")
    with tempfile.TemporaryDirectory(prefix="wf-local-", dir="/tmp") as tmp:
        ROOT = Path(tmp)
        socket = ROOT / "socket"
        socket.mkdir(mode=0o700)
        ENV = {k:v for k,v in os.environ.items() if not k.startswith("PG")}
        ENV.update(PGHOST=str(socket), PGPORT="55439", PGDATABASE=DB, PGUSER="wf_validator", PGCONNECT_TIMEOUT="5",
                   PGOPTIONS="-c statement_timeout=15000 -c lock_timeout=10000")
        command(["psql", "--version"])
        REPORT["python_version"] = os.sys.version
        command(["initdb", "-D", str(ROOT/"data"), "-U", "wf_validator", "--auth-local=trust", "--auth-host=reject", "--no-locale"])
        with (ROOT/"data"/"postgresql.conf").open("a") as f:
            f.write(f"\nlisten_addresses=''\nunix_socket_directories='{socket}'\nport=55439\nfsync=on\nfull_page_writes=on\nsynchronous_commit=on\n")
        try:
            command(["pg_ctl", "-D", str(ROOT/"data"), "-l", str(ROOT/"postgres.log"), "-w", "start"])
            sql(f"CREATE DATABASE {DB}", db="postgres")
            REPORT["settings"] = value("SELECT json_build_object('version',version(),'isolation',current_setting('transaction_isolation'),'fsync',current_setting('fsync'),'full_page_writes',current_setting('full_page_writes'),'synchronous_commit',current_setting('synchronous_commit'),'listen_addresses',current_setting('listen_addresses'))")
            sql((HERE/"schema.sql").read_text())
            for name, fn in [("capacity_one_and_adjacent_ranges",capacity_one), ("capacity_three",capacity_three),
                             ("multi_resource_rollback",atomic_booking), ("payment_idempotency",payments),
                             ("completion_stock_commission_atomicity",stock_atomicity), ("outbox_worker_crash_restart",workers),
                             ("private_file_session_permission_fixture",private_files), ("database_restart_dump_restore",backup)]:
                test(name, fn)
        finally:
            if (ROOT/"data"/"postmaster.pid").exists():
                command(["pg_ctl", "-D", str(ROOT/"data"), "-m", "fast", "-w", "stop"], check=False)
            if (ROOT/"postgres.log").exists():
                REPORT["postgres_log"] = (ROOT/"postgres.log").read_text()


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        REPORT["fatal_error"] = repr(exc)
    finally:
        REPORT["elapsed_seconds"] = time.monotonic()-START
        REPORT["finished_utc"] = datetime.now(timezone.utc).isoformat()
        REPORT["source_sha256"] = {p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in (HERE/"run.py",HERE/"schema.sql",HERE/"PLAN.md")}
        result = HERE / ("results-"+datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ")+".json")
        result.write_text(json.dumps(REPORT, ensure_ascii=False, indent=2))
        print(json.dumps({"report":str(result),"tests":[{"name":r["name"],"status":r["status"]} for r in REPORT["tests"]], "fatal_error":REPORT.get("fatal_error"),"seconds":REPORT["elapsed_seconds"]},ensure_ascii=False,indent=2))
    if REPORT.get("fatal_error"):
        raise SystemExit(1)

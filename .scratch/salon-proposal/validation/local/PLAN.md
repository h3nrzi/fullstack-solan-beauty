# Local validation protocol — 2026-11-02

Scope: disposable technical harness, synthetic data only, no product code. Operator: Codex; no human team skill evaluation. Cash purchase budget: 0 toman. No downloads, service accounts or paid resources. Existing PostgreSQL 14.23 and Python 3.14.7 only. PostgreSQL 14 is the available experimental version, not a production version selection.

Before execution: use a fresh temporary cluster, Unix socket only, private temporary directory, no existing database connection. fsync/full_page_writes/synchronous_commit on; READ COMMITTED. SQL statements have 15-second timeouts. Preserve commands, errors and results in JSON; stop on unexpected result. Always stop only the cluster created by this run. Temporary files are deleted after evidence is saved.

Tests and thresholds (correctness only; numbers are synthetic fixtures, not approved salon load):

1. Two independent transactions contest capacity one with the winner held open: one accepted and one exclusion conflict, zero duplicate occupancy; adjacent half-open ranges accepted.
2. Four concurrent transactions allocate three explicit physical units: three accepted, one capacity rejection, zero overbooking. This does not validate aggregate-capacity algorithms or capacity changes.
3. Allocate artist and first stage resource then conflict at last resource: full rollback, zero partial rows or outbox events.
4. Ten concurrent notifications, two notification IDs, same provider payment identity: one financial effect and one outbox row. Same identity/different amount rejected. Replay after committed response loss returns same receipt.
5. Fail between stock deduction and commission write: no partial stock/commission/financial rows. Repeat successful completion: one effect. Two transactions contest last stock: one success, no negative stock.
6. Commit event while no worker exists, terminate a worker backend after its local effect write and before commit, restart with two independent workers: all 21 committed events processed once locally, no partial effects from terminated worker. External delivery uncertainty is kept in a separate unknown state and is not automatically resent. No actual SMS/payment provider tested.
7. Loopback HTTP fixture queries session and permission state on every file request: authorized request 200, missing/unrelated/revoked/old token 403; no-store header; direct path rejected; session revoked between requests cannot fetch again. Private filesystem permissions checked. This tests fixture behavior, not NestJS, production object storage, browser caches, downloads already obtained, MFA, OTP, or deletion policy.
8. Stop/restart disposable PostgreSQL: committed records survive. Custom-format pg_dump; drop ONLY synthetic source database; restore into another database in same temporary cluster; canonical full row digest and counts match. Corrupt archive must be rejected. Record dump/restore time. This is a preliminary logical backup test, not independent-host recovery, PITR, RTO/RPO proof or media restore.

No throughput or latency acceptance is defined. Record observations only. Approved peak load and latency thresholds, full scheduling engine, live providers, production stack/version, access from Iranian user networks, team skills, security review and hosting costs remain untested. Results use: تأییدشده با آزمون / ردشده با شواهد / هنوز آزمون‌نشده. Expected rejection of invalid input counts as a passed negative scenario, not failure of architecture.

Reproduce: from repo root run `python3 .scratch/salon-proposal/validation/local/run.py`. Requires existing PostgreSQL executables in PATH and `btree_gist`. No installation is performed. Each run creates a distinct `results-*.json` beside this file; comparison is per named scenario, not just total pass count.

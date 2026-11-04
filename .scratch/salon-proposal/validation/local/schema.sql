CREATE EXTENSION btree_gist;
CREATE TABLE allocation (
 id bigserial PRIMARY KEY, booking text NOT NULL, unit text NOT NULL,
 span int4range NOT NULL CHECK (NOT isempty(span)),
 EXCLUDE USING gist (unit WITH =, span WITH &&)
);
CREATE TABLE unit (id int PRIMARY KEY);
INSERT INTO unit VALUES (1),(2),(3);
CREATE TABLE outbox (id text PRIMARY KEY, state text NOT NULL DEFAULT 'pending', created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE effect (id text PRIMARY KEY, executions int NOT NULL DEFAULT 1);
CREATE TABLE payment (provider text NOT NULL, reference text NOT NULL, amount int NOT NULL CHECK(amount>0), receipt bigint GENERATED ALWAYS AS IDENTITY, PRIMARY KEY(provider,reference));
CREATE FUNCTION receive_payment(p text, r text, a int) RETURNS bigint LANGUAGE plpgsql AS $$
DECLARE stored payment;
BEGIN
 INSERT INTO payment(provider,reference,amount) VALUES(p,r,a) ON CONFLICT DO NOTHING;
 SELECT * INTO STRICT stored FROM payment WHERE provider=p AND reference=r FOR UPDATE;
 IF stored.amount <> a THEN RAISE EXCEPTION 'payment amount mismatch'; END IF;
 INSERT INTO outbox(id) VALUES('payment:'||p||':'||r) ON CONFLICT DO NOTHING;
 RETURN stored.receipt;
END $$;
CREATE TABLE stock (id int PRIMARY KEY, quantity int NOT NULL CHECK(quantity>=0));
INSERT INTO stock VALUES (1,1);
CREATE TABLE completion (id text PRIMARY KEY);
CREATE TABLE commission (id text PRIMARY KEY REFERENCES completion, amount int NOT NULL);
CREATE FUNCTION complete_service(k text, fail boolean) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
 INSERT INTO completion VALUES(k) ON CONFLICT DO NOTHING;
 IF NOT FOUND THEN RETURN; END IF;
 UPDATE stock SET quantity=quantity-1 WHERE id=1 AND quantity>=1;
 IF NOT FOUND THEN RAISE EXCEPTION 'insufficient stock'; END IF;
 IF fail THEN RAISE EXCEPTION 'injected before commission'; END IF;
 INSERT INTO commission VALUES(k,30);
 INSERT INTO outbox(id) VALUES('completion:'||k);
END $$;
CREATE TABLE session (token text PRIMARY KEY, owner_id int NOT NULL, active boolean NOT NULL, can_read boolean NOT NULL);
INSERT INTO session VALUES ('synthetic-owner',1,true,true),('synthetic-other',2,true,true),('synthetic-no-permission',1,true,false);
CREATE TABLE media (id int PRIMARY KEY, owner_id int NOT NULL);
INSERT INTO media VALUES(1,1);

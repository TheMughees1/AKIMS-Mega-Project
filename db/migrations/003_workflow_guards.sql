-- Database safeguards complement the service's authorization and request locks.
CREATE FUNCTION guard_clearance_approval() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status='approved' AND OLD.status<>'approved' THEN
    IF OLD.status<>'under_review'
      OR NEW.approved_by IS NULL
      OR NOT EXISTS (SELECT 1 FROM users WHERE id=NEW.approved_by AND active)
      OR NEW.approved_by::text IS DISTINCT FROM (SELECT value #>> '{}' FROM settings WHERE key='final_approver')
      OR NOT EXISTS (SELECT 1 FROM clearance_checks WHERE request_id=NEW.id)
      OR EXISTS (SELECT 1 FROM clearance_checks WHERE request_id=NEW.id AND status<>'cleared')
      OR EXISTS (SELECT 1 FROM incidents WHERE request_id=NEW.id AND status IN ('investigating','confirmed'))
      OR EXISTS (SELECT 1 FROM challans WHERE request_id=NEW.id AND status='issued')
    THEN RAISE EXCEPTION 'Final clearance prerequisites are not satisfied' USING ERRCODE='23514';
    END IF;
  END IF;
  IF OLD.status='approved' AND NEW.status<>'approved' THEN
    RAISE EXCEPTION 'Approved requests are historical records; use certificate revocation' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER clearance_approval_guard BEFORE UPDATE ON clearance_requests FOR EACH ROW EXECUTE FUNCTION guard_clearance_approval();

CREATE FUNCTION guard_certificate_issue() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM 1 FROM clearance_requests WHERE id=NEW.request_id AND status='approved' AND approved_by=NEW.issued_by FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Certificate requires an authorized final approval' USING ERRCODE='23514'; END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER certificate_issue_guard BEFORE INSERT ON certificates FOR EACH ROW EXECUTE FUNCTION guard_certificate_issue();

CREATE FUNCTION guard_closed_requirements() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE parent_status text;
BEGIN
  SELECT status INTO parent_status FROM clearance_requests WHERE id=COALESCE(NEW.request_id,OLD.request_id) FOR UPDATE;
  IF parent_status <> 'under_review' THEN
    RAISE EXCEPTION 'Requirements on a closed request cannot be rewritten' USING ERRCODE='23514';
  END IF;
  IF TG_OP='DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER check_history_guard BEFORE INSERT OR UPDATE OR DELETE ON clearance_checks FOR EACH ROW EXECUTE FUNCTION guard_closed_requirements();
CREATE TRIGGER incident_history_guard BEFORE INSERT OR UPDATE OR DELETE ON incidents FOR EACH ROW EXECUTE FUNCTION guard_closed_requirements();

CREATE FUNCTION immutable_history() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'This record is immutable; retain it and record an authorized new action' USING ERRCODE='23514';
END; $$;
CREATE TRIGGER audit_append_only BEFORE UPDATE OR DELETE ON audit_events FOR EACH ROW EXECUTE FUNCTION immutable_history();
CREATE TRIGGER challan_lines_immutable BEFORE UPDATE OR DELETE ON challan_lines FOR EACH ROW EXECUTE FUNCTION immutable_history();

CREATE FUNCTION preserve_challan_snapshot() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.amount_paisa<>OLD.amount_paisa OR NEW.bank_snapshot<>OLD.bank_snapshot OR NEW.request_id<>OLD.request_id OR NEW.currency<>OLD.currency THEN
    RAISE EXCEPTION 'Issued challan snapshots are immutable' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER challan_snapshot_guard BEFORE UPDATE ON challans FOR EACH ROW EXECUTE FUNCTION preserve_challan_snapshot();

ALTER TABLE import_batches ADD COLUMN source_mapping jsonb;
ALTER TABLE students ADD COLUMN import_batch_id uuid REFERENCES import_batches;
ALTER TABLE students ADD COLUMN import_row_number integer CHECK(import_row_number>=2);

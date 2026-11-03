ALTER TABLE certificates ADD COLUMN document_snapshot jsonb NOT NULL DEFAULT '{}';
UPDATE certificates c SET document_snapshot=jsonb_build_object(
  'student_name',u.name,'student_number',s.student_number,'program',p.name
) FROM clearance_requests r
  JOIN students s ON s.id=r.student_id
  JOIN users u ON u.id=s.user_id
  JOIN enrollments e ON e.id=r.enrollment_id
  JOIN programs p ON p.id=e.program_id
WHERE c.request_id=r.id;
CREATE FUNCTION preserve_certificate_identity() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.document_snapshot<>OLD.document_snapshot OR NEW.request_id<>OLD.request_id
    OR NEW.token<>OLD.token OR NEW.issued_by<>OLD.issued_by OR NEW.issued_at<>OLD.issued_at THEN
    RAISE EXCEPTION 'Certificate identity is immutable; revoke and use an authorized correction workflow' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER certificate_identity_guard BEFORE UPDATE ON certificates FOR EACH ROW EXECUTE FUNCTION preserve_certificate_identity();

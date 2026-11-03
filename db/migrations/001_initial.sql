CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL, email text NOT NULL UNIQUE,
  password_hash text NOT NULL, active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE user_roles (
  user_id uuid REFERENCES users ON DELETE RESTRICT,
  role text CHECK(role IN ('student','staff','accounts','admin','teacher','alumni')),
  PRIMARY KEY(user_id,role)
);
CREATE TABLE sessions (
  token_hash text PRIMARY KEY, user_id uuid NOT NULL REFERENCES users,
  active_role text NOT NULL, expires_at timestamptz NOT NULL,
  FOREIGN KEY(user_id,active_role) REFERENCES user_roles(user_id,role)
);
CREATE INDEX ON sessions(expires_at);
CREATE TABLE login_attempts (
  key text PRIMARY KEY, attempts integer NOT NULL DEFAULT 0, reset_at timestamptz NOT NULL
);
CREATE TABLE programs (
  id text PRIMARY KEY, name text NOT NULL, abbreviation text NOT NULL
);
CREATE TABLE students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid UNIQUE NOT NULL REFERENCES users,
  student_number text UNIQUE NOT NULL, phone text, alumni boolean NOT NULL DEFAULT false
);
CREATE TABLE enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), student_id uuid NOT NULL REFERENCES students,
  program_id text NOT NULL REFERENCES programs, batch text NOT NULL,
  semester integer NOT NULL CHECK(semester BETWEEN 1 AND 20),
  status text NOT NULL CHECK(status IN ('active','completed','withdrawn')),
  UNIQUE(id,student_id)
);
CREATE TABLE departments (
  id text PRIMARY KEY, name text NOT NULL, kind text CHECK(kind IN ('lab','store'))
);
CREATE TABLE staff_assignments (
  user_id uuid REFERENCES users, department_id text REFERENCES departments,
  PRIMARY KEY(user_id,department_id)
);
CREATE TABLE program_requirements (
  program_id text REFERENCES programs, department_id text REFERENCES departments,
  PRIMARY KEY(program_id,department_id)
);
CREATE TABLE clearance_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number bigint GENERATED ALWAYS AS IDENTITY UNIQUE,
  student_id uuid NOT NULL REFERENCES students, enrollment_id uuid NOT NULL,
  purpose text NOT NULL CHECK(purpose IN ('graduation','transfer','withdrawal')),
  status text NOT NULL DEFAULT 'under_review' CHECK(status IN ('under_review','approved','cancelled')),
  policy_version integer NOT NULL DEFAULT 1,
  created_by uuid NOT NULL REFERENCES users, created_at timestamptz NOT NULL DEFAULT now(),
  approved_by uuid REFERENCES users, approved_at timestamptz,
  FOREIGN KEY(enrollment_id,student_id) REFERENCES enrollments(id,student_id)
);
CREATE UNIQUE INDEX one_current_clearance ON clearance_requests(enrollment_id,purpose) WHERE status <> 'cancelled';
CREATE INDEX ON clearance_requests(status,created_at);
CREATE TABLE clearance_checks (
  request_id uuid REFERENCES clearance_requests, department_id text REFERENCES departments,
  status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','action_required','cleared')),
  note text NOT NULL DEFAULT '', reviewed_by uuid REFERENCES users, reviewed_at timestamptz,
  PRIMARY KEY(request_id,department_id)
);
CREATE TABLE inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), department_id text NOT NULL REFERENCES departments,
  name text NOT NULL, sku text UNIQUE NOT NULL,
  category text NOT NULL CHECK(category IN ('apparatus','consumable','computer')),
  quantity integer NOT NULL DEFAULT 0 CHECK(quantity>=0),
  reorder_level integer NOT NULL DEFAULT 5 CHECK(reorder_level>=0),
  unit text NOT NULL DEFAULT 'units', location text NOT NULL,
  retired boolean NOT NULL DEFAULT false
);
CREATE TABLE stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), inventory_id uuid NOT NULL REFERENCES inventory,
  delta integer NOT NULL CHECK(delta<>0), reason text NOT NULL,
  actor_id uuid NOT NULL REFERENCES users, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), request_id uuid NOT NULL REFERENCES clearance_requests,
  department_id text NOT NULL REFERENCES departments, inventory_id uuid REFERENCES inventory,
  title text NOT NULL, description text NOT NULL, amount_paisa integer NOT NULL CHECK(amount_paisa>=0),
  status text NOT NULL CHECK(status IN ('investigating','confirmed','resolved','waived')),
  resolution text, created_by uuid NOT NULL REFERENCES users,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY(request_id,department_id) REFERENCES clearance_checks(request_id,department_id)
);
CREATE INDEX ON incidents(request_id,status);
CREATE TABLE settings (key text PRIMARY KEY, value jsonb NOT NULL);
CREATE TABLE challans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), number bigint GENERATED ALWAYS AS IDENTITY UNIQUE,
  request_id uuid NOT NULL REFERENCES clearance_requests,
  amount_paisa integer NOT NULL CHECK(amount_paisa>0),
  currency text NOT NULL DEFAULT 'PKR' CHECK(currency='PKR'),
  status text NOT NULL DEFAULT 'issued' CHECK(status IN ('issued','paid','cancelled')),
  bank_snapshot jsonb NOT NULL, created_by uuid NOT NULL REFERENCES users,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX one_current_challan ON challans(request_id) WHERE status <> 'cancelled';
CREATE TABLE challan_lines (
  challan_id uuid REFERENCES challans, incident_id uuid NOT NULL REFERENCES incidents,
  title text NOT NULL, amount_paisa integer NOT NULL CHECK(amount_paisa>0),
  PRIMARY KEY(challan_id,incident_id)
);
CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), challan_id uuid NOT NULL REFERENCES challans,
  amount_paisa integer NOT NULL CHECK(amount_paisa>0), transaction_reference text NOT NULL,
  paid_on date NOT NULL, receipt_path text NOT NULL, receipt_type text NOT NULL,
  receipt_hash text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','verified','rejected')),
  submitted_by uuid NOT NULL REFERENCES users, created_at timestamptz NOT NULL DEFAULT now(),
  bank_reference text, verified_by uuid REFERENCES users, verified_at timestamptz,
  note text NOT NULL DEFAULT ''
);
CREATE UNIQUE INDEX unique_bank_payment ON payments(bank_reference) WHERE status='verified';
CREATE UNIQUE INDEX one_payment_in_review ON payments(challan_id) WHERE status IN ('pending','verified');
CREATE UNIQUE INDEX duplicate_receipt ON payments(receipt_hash) WHERE status IN ('pending','verified');
CREATE TABLE certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), number bigint GENERATED ALWAYS AS IDENTITY UNIQUE,
  request_id uuid UNIQUE NOT NULL REFERENCES clearance_requests,
  token text UNIQUE NOT NULL, status text NOT NULL DEFAULT 'active' CHECK(status IN ('active','revoked')),
  issued_by uuid NOT NULL REFERENCES users, issued_at timestamptz NOT NULL DEFAULT now(),
  revocation_reason text
);
CREATE TABLE audit_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_id uuid REFERENCES users, action text NOT NULL,
  request_id uuid REFERENCES clearance_requests, detail text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON audit_events(request_id,created_at);
CREATE TABLE announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL, body text NOT NULL,
  category text NOT NULL, audience text[] NOT NULL, published_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), teacher_id uuid NOT NULL REFERENCES users,
  name text NOT NULL, program_id text NOT NULL REFERENCES programs,
  semester integer NOT NULL, section text NOT NULL, student_count integer NOT NULL,
  schedule text NOT NULL
);
CREATE TABLE class_observations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), class_id uuid NOT NULL REFERENCES classes,
  teacher_id uuid NOT NULL REFERENCES users, body text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE import_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), actor_id uuid NOT NULL REFERENCES users,
  source_hash text NOT NULL UNIQUE, row_count integer NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);

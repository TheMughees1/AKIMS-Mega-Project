CREATE UNIQUE INDEX user_email_case_insensitive ON users(lower(email));
CREATE UNIQUE INDEX student_number_case_insensitive ON students(lower(student_number));

-- DropIndex
DROP INDEX "idx_assignment_current";

-- Partial index: fast lookup of current assignments by diocese and person
CREATE INDEX idx_assignment_current
  ON assignment (see_id, person_id)
  WHERE is_current = true;

-- GIN full-text search on person name fields
CREATE INDEX idx_person_search ON person USING gin(
  to_tsvector('english',
    first_name || ' ' || coalesce(middle_name, '') || ' ' || last_name)
);

-- GIN full-text search on see name
CREATE INDEX idx_see_search ON see USING gin(
  to_tsvector('english', name)
);

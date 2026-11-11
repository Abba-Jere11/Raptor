-- New approval types must be committed before the next migration uses them.
ALTER TYPE approval_type ADD VALUE IF NOT EXISTS 'featured_selection';

ALTER TYPE approval_type ADD VALUE IF NOT EXISTS 'delivery_entry';

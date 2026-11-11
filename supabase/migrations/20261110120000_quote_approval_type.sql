-- New approval types must be committed before the next migration uses them.
ALTER TYPE approval_type ADD VALUE IF NOT EXISTS 'quote_discount';

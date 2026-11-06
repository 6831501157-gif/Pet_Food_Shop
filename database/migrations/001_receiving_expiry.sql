-- Run once on an existing database. Existing receipts retain an unknown expiry.
ALTER TABLE purchase_details ADD COLUMN expiry_date DATE NULL;


CREATE OR REPLACE VIEW branch_monthly_purchase_summary AS
SELECT 
    b.id AS branch_id,
    b.name AS branch_name,
    b.branch_code,
    TO_CHAR(pb.purchase_date, 'YYYY-MM') AS month,
    EXTRACT(YEAR FROM pb.purchase_date)::INTEGER AS year,
    EXTRACT(MONTH FROM pb.purchase_date)::INTEGER AS month_num,
    TO_CHAR(pb.purchase_date, 'Month') AS month_name,
    si.id AS store_item_id,
    si.name AS store_item_name,
    si.category,
    sv.id AS variant_id,
    sv.variant_name,
    sv.base_unit,
    s.id AS supplier_id,
    s.supplier_name,
    COUNT(pb.id) AS purchase_count,
    SUM(pb.quantity_purchased) AS total_quantity_purchased,
    SUM(pb.total_cost) AS total_amount_spent,
    AVG(pb.unit_price) AS avg_unit_price,
    MIN(pb.unit_price) AS lowest_price,
    MAX(pb.unit_price) AS highest_price
FROM purchase_batches pb
JOIN branches b ON pb.branch_id = b.id
JOIN store_items_variants sv ON pb.variant_id = sv.id
JOIN store_items si ON sv.store_item_id = si.id
LEFT JOIN suppliers s ON pb.supplier_id = s.id
WHERE pb.status = 'approved' AND pb.deleted_at IS NULL
GROUP BY b.id, b.name, b.branch_code, month, year, month_num, month_name,
         si.id, si.name, si.category, sv.id, sv.variant_name, sv.base_unit, 
         s.id, s.supplier_name;

-- 2. Branch Monthly Usage Summary
CREATE OR REPLACE VIEW branch_monthly_usage_summary AS
SELECT 
    b.id AS branch_id,
    b.name AS branch_name,
    b.branch_code,
    TO_CHAR(du.usage_date, 'YYYY-MM') AS month,
    EXTRACT(YEAR FROM du.usage_date)::INTEGER AS year,
    EXTRACT(MONTH FROM du.usage_date)::INTEGER AS month_num,
    TO_CHAR(du.usage_date, 'Month') AS month_name,
    si.id AS store_item_id,
    si.name AS store_item_name,
    si.category,
    sv.id AS variant_id,
    sv.variant_name,
    sv.base_unit,
    COUNT(du.id) AS usage_days,
    SUM(du.quantity_used) AS total_quantity_used,
    SUM(du.total_cost) AS total_cost,
    AVG(du.quantity_used) AS avg_daily_usage,
    AVG(du.total_cost) AS avg_daily_cost
FROM daily_usage du
JOIN branches b ON du.branch_id = b.id
JOIN store_items_variants sv ON du.variant_id = sv.id
JOIN store_items si ON sv.store_item_id = si.id
WHERE du.deleted_at IS NULL
GROUP BY b.id, b.name, b.branch_code, month, year, month_num, month_name,
         si.id, si.name, si.category, sv.id, sv.variant_name, sv.base_unit;

-- 3. Multi-Branch Inventory View
CREATE OR REPLACE VIEW multi_branch_inventory AS
SELECT 
    b.id AS branch_id,
    b.name AS branch_name,
    b.branch_code,
    b.city,
    si.id AS store_item_id,
    si.name AS store_item_name,
    si.category,
    sv.id AS variant_id,
    sv.variant_name,
    bi.current_stock,
    sv.base_unit,
    bi.min_stock_level,
    COALESCE(SUM(pb.quantity_remaining * pb.unit_price), 0) AS inventory_value,
    CASE 
        WHEN bi.current_stock < bi.min_stock_level THEN 'LOW STOCK'
        WHEN bi.current_stock = 0 THEN 'OUT OF STOCK'
        ELSE 'OK'
    END AS stock_status
FROM branches b
JOIN branch_inventory bi ON b.id = bi.branch_id
JOIN store_items_variants sv ON bi.variant_id = sv.id
JOIN store_items si ON sv.store_item_id = si.id
LEFT JOIN purchase_batches pb ON bi.branch_id = pb.branch_id 
    AND bi.variant_id = pb.variant_id 
    AND pb.quantity_remaining > 0
    AND pb.status = 'approved'
    AND pb.deleted_at IS NULL
WHERE b.is_active = TRUE AND bi.deleted_at IS NULL
GROUP BY b.id, b.name, b.branch_code, b.city, si.id, si.name, si.category, 
         sv.id, sv.variant_name, bi.current_stock, sv.base_unit, bi.min_stock_level;

-- 4. Branch Performance Summary
CREATE OR REPLACE VIEW branch_performance_summary AS
SELECT 
    b.id AS branch_id,
    b.name AS branch_name,
    b.branch_code,
    b.city,
    b.is_active,
    COUNT(DISTINCT pb.id) FILTER (WHERE pb.deleted_at IS NULL) AS total_purchases,
    SUM(pb.total_cost) FILTER (WHERE pb.status = 'approved' AND pb.deleted_at IS NULL) AS total_purchase_cost,
    COUNT(DISTINCT du.id) FILTER (WHERE du.deleted_at IS NULL) AS total_usage_days,
    SUM(du.total_cost) FILTER (WHERE du.deleted_at IS NULL) AS total_usage_cost,
    COUNT(DISTINCT bi.variant_id) FILTER (WHERE bi.deleted_at IS NULL) AS items_in_inventory,
    SUM(bi.current_stock) FILTER (WHERE bi.deleted_at IS NULL) AS total_stock_units,
    (SELECT COUNT(*) FROM users WHERE branch_id = b.id AND is_active = TRUE AND deleted_at IS NULL) AS total_staff
FROM branches b
LEFT JOIN purchase_batches pb ON b.id = pb.branch_id
LEFT JOIN daily_usage du ON b.id = du.branch_id
LEFT JOIN branch_inventory bi ON b.id = bi.branch_id
WHERE b.deleted_at IS NULL
GROUP BY b.id, b.name, b.branch_code, b.city, b.is_active;

-- 5. Company Inventory Summary
CREATE OR REPLACE VIEW company_inventory_summary AS
SELECT 
    COUNT(DISTINCT branch_id) AS total_branches,
    COUNT(DISTINCT variant_id) AS unique_items,
    SUM(current_stock) AS total_stock_units,
    SUM(inventory_value) AS total_inventory_value,
    SUM(CASE WHEN stock_status = 'LOW STOCK' THEN 1 ELSE 0 END) AS low_stock_count,
    SUM(CASE WHEN stock_status = 'OUT OF STOCK' THEN 1 ELSE 0 END) AS out_of_stock_count
FROM multi_branch_inventory;
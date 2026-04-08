
CREATE OR REPLACE FUNCTION update_inventory_on_purchase_approval()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
        INSERT INTO branch_inventory (branch_id, variant_id, current_stock, min_stock_level, last_updated)
        VALUES (
            NEW.branch_id,
            NEW.variant_id,
            NEW.quantity_purchased,
            (SELECT default_min_stock FROM store_items_variants WHERE id = NEW.variant_id),
            NOW()
        )
        ON CONFLICT (branch_id, variant_id)
        DO UPDATE SET
            current_stock = branch_inventory.current_stock + NEW.quantity_purchased,
            last_updated = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_purchase_approval
AFTER INSERT OR UPDATE OF status ON purchase_batches
FOR EACH ROW
EXECUTE FUNCTION update_inventory_on_purchase_approval();

-- 2. FIFO Usage Calculation Function
CREATE OR REPLACE FUNCTION calculate_fifo_usage(
    p_branch_id UUID,
    p_variant_id UUID,
    p_quantity_used NUMERIC,
    p_usage_id UUID
) RETURNS NUMERIC AS $$
DECLARE
    v_total_cost NUMERIC := 0;
    v_remaining_qty NUMERIC := p_quantity_used;
    v_batch RECORD;
BEGIN
    FOR v_batch IN
        SELECT id, quantity_remaining, unit_price
        FROM purchase_batches
        WHERE branch_id = p_branch_id
          AND variant_id = p_variant_id
          AND quantity_remaining > 0
          AND status = 'approved'
          AND deleted_at IS NULL
        ORDER BY purchase_date ASC, id ASC
    LOOP
        EXIT WHEN v_remaining_qty <= 0;
        
        DECLARE
            v_qty_from_batch NUMERIC := LEAST(v_batch.quantity_remaining, v_remaining_qty);
            v_batch_cost NUMERIC := v_qty_from_batch * v_batch.unit_price;
        BEGIN
            INSERT INTO usage_batch_details (usage_id, batch_id, quantity_used, unit_price, cost)
            VALUES (p_usage_id, v_batch.id, v_qty_from_batch, v_batch.unit_price, v_batch_cost);

            UPDATE purchase_batches
            SET quantity_remaining = quantity_remaining - v_qty_from_batch,
                updated_at = NOW()
            WHERE id = v_batch.id;

            v_total_cost := v_total_cost + v_batch_cost;
            v_remaining_qty := v_remaining_qty - v_qty_from_batch;
        END;
    END LOOP;

    -- Update branch inventory
    UPDATE branch_inventory
    SET current_stock = current_stock - p_quantity_used,
        last_updated = NOW()
    WHERE branch_id = p_branch_id AND variant_id = p_variant_id;

    RETURN v_total_cost;
END;
$$ LANGUAGE plpgsql;

-- 3. Auto calculate usage cost on daily_usage insert
CREATE OR REPLACE FUNCTION auto_calculate_usage_cost()
RETURNS TRIGGER AS $$
DECLARE
    v_calculated_cost NUMERIC;
BEGIN
    v_calculated_cost := calculate_fifo_usage(
        NEW.branch_id,
        NEW.variant_id,
        NEW.quantity_used,
        NEW.id
    );

    UPDATE daily_usage
    SET total_cost = v_calculated_cost
    WHERE id = NEW.id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_calculate_usage_cost
AFTER INSERT ON daily_usage
FOR EACH ROW
EXECUTE FUNCTION auto_calculate_usage_cost();

-- 4. Generate Order Number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
    v_branch_code VARCHAR(10);
    v_date_part VARCHAR(20);
    v_sequence INTEGER;
BEGIN
    SELECT branch_code INTO v_branch_code FROM branches WHERE id = NEW.branch_id;
    v_date_part := TO_CHAR(NEW.created_at, 'YYYYMMDD');

    SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM '\d+$') AS INTEGER)), 0) + 1
    INTO v_sequence
    FROM orders
    WHERE branch_id = NEW.branch_id
      AND DATE(created_at) = DATE(NEW.created_at);

    NEW.order_number := FORMAT('ORD-%s-%s-%s', v_branch_code, v_date_part, LPAD(v_sequence::TEXT, 3, '0'));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_order_number
BEFORE INSERT ON orders
FOR EACH ROW
WHEN (NEW.order_number IS NULL OR NEW.order_number = '')
EXECUTE FUNCTION generate_order_number();

-- 5. Update Order Totals
CREATE OR REPLACE FUNCTION update_order_totals()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE orders
    SET subtotal = (SELECT COALESCE(SUM(subtotal), 0) FROM order_items WHERE order_id = COALESCE(NEW.order_id, OLD.order_id)),
        total_amount = (SELECT COALESCE(SUM(subtotal), 0) FROM order_items WHERE order_id = COALESCE(NEW.order_id, OLD.order_id))
    WHERE id = COALESCE(NEW.order_id, OLD.order_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_order_totals
AFTER INSERT OR UPDATE OR DELETE ON order_items
FOR EACH ROW
EXECUTE FUNCTION update_order_totals();
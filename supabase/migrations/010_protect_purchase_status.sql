-- Migration: Protect has_purchased from client-side updates
-- Only the service role (Stripe webhook) should be able to set has_purchased = true
-- This prevents users from granting themselves premium via console/API

-- Function to prevent unauthorized purchase status updates
CREATE OR REPLACE FUNCTION protect_purchase_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow if has_purchased is not being changed
  IF OLD.has_purchased IS NOT DISTINCT FROM NEW.has_purchased
     AND OLD.purchase_date IS NOT DISTINCT FROM NEW.purchase_date THEN
    RETURN NEW;
  END IF;

  -- Allow service role to update anything
  -- Service role is used by Stripe webhook and server-side functions
  IF current_setting('role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Allow if setting to false (downgrade is OK)
  IF NEW.has_purchased = false THEN
    RETURN NEW;
  END IF;

  -- Block users from setting has_purchased = true
  RAISE EXCEPTION 'Cannot modify purchase status. Purchases must go through the payment system.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply trigger to users table
DROP TRIGGER IF EXISTS protect_purchase_status_trigger ON users;
CREATE TRIGGER protect_purchase_status_trigger
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION protect_purchase_status();

-- Add comment explaining the security measure
COMMENT ON FUNCTION protect_purchase_status() IS
  'Security trigger: Prevents users from self-granting premium status. Only service role (webhooks) can set has_purchased = true.';

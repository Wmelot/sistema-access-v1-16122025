-- Function to safely increment sent count
CREATE OR REPLACE FUNCTION increment_campaign_sent(campaign_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE marketing_campaigns
  SET sent_count = sent_count + 1,
      updated_at = NOW()
  WHERE id = campaign_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to safely increment failed count
CREATE OR REPLACE FUNCTION increment_campaign_failed(campaign_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE marketing_campaigns
  SET failed_count = failed_count + 1,
      updated_at = NOW()
  WHERE id = campaign_uuid;
END;
$$ LANGUAGE plpgsql;

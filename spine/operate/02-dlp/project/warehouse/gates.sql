-- Every gate's verdict for a night, as the gates recorded them.
SELECT gate, passed, detail
FROM audit.gate_results
WHERE dt = @dt
ORDER BY gate, checked_at

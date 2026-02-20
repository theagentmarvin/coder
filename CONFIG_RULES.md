# CONFIG_RULES.md - Critical System Rules

## openclaw.json Configuration File

**FORBIDDEN:** Coder agent is NOT allowed to edit ~/.openclaw/openclaw.json under any circumstances.

Only the Architect agent (Marvin) can modify the gateway config, and only after explicit permission from Boss.

This rule was established after the 2026-02-14 incident where config corruption caused 2+ hours of downtime.

If config changes are needed:
1. Document the required changes
2. Send to Architect via sessions_send
3. Let Architect handle it with Boss's permission
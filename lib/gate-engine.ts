import type {
  GateCheckResult,
  HouseGate,
  POAP,
} from "@/lib/types"

export interface GateUserData {
  poaps: POAP[]
  skills?: string[]
  talent_tags?: string[]
}

/**
 * Evaluate POAP gate: user must hold at least one of the required POAPs.
 */
function evaluatePoap(
  config: { event_ids?: string[] },
  user: GateUserData,
): GateCheckResult {
  const requiredIds = config.event_ids ?? []
  if (requiredIds.length === 0) {
    return { gate_type: "poap", passed: true, reason: "No POAPs required", matched: [] }
  }

  const requiredSet = new Set(requiredIds)
  const matchedPoaps = user.poaps.filter((p) => requiredSet.has(p.id))
  const passed = matchedPoaps.length > 0

  return {
    gate_type: "poap",
    passed,
    reason: passed
      ? "Has required POAP"
      : "Requires a specific POAP attendance",
    matched: matchedPoaps.map((p) => p.name),
  }
}

function evaluateSkill(
  config: { skills?: string[] },
  user: GateUserData,
): GateCheckResult {
  const required = config.skills ?? []
  if (required.length === 0) {
    return { gate_type: "skill", passed: true, reason: "No skills required", matched: [] }
  }
  const userSkills = new Set([
    ...(user.skills ?? []).map((s) => s.toLowerCase()),
    ...(user.talent_tags ?? []).map((s) => s.toLowerCase()),
  ])
  const matched = required.filter((s) => userSkills.has(s.toLowerCase()))
  const passed = matched.length > 0
  return {
    gate_type: "skill",
    passed,
    reason: passed ? "Has required skill" : "Requires a specific skill",
    matched,
  }
}

/**
 * Evaluate all gates for an entity against a user's data.
 * All gates must pass (AND logic).
 * Returns per-gate results with generic reasons (never leaks user data).
 */
export function evaluateGates(user: GateUserData, gates: HouseGate[]): GateCheckResult[] {
  return gates.map((gate) => {
    if (gate.gate_type === "poap") {
      return evaluatePoap(gate.config as { event_ids?: string[] }, user)
    }
    if (gate.gate_type === "skill") {
      return evaluateSkill(gate.config as { skills?: string[] }, user)
    }
    return { gate_type: gate.gate_type, passed: false, reason: "Unknown gate type", matched: [] }
  })
}

/** Quick check: do all gates pass? */
export function allGatesPassed(results: GateCheckResult[]): boolean {
  return results.every((r) => r.passed)
}

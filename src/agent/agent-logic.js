/**
 * The inputs to an agent's decision-making process
 * @typedef {Object} AgentInputs
 * @property {boolean} hasNearbyAgents
 * @property {object[]} agentDetections
 * @property {boolean} isAtGoal
 */

/**
 * The possible results of an agent's decision-making process
 * @typedef {Object} AgentActions
 * @property {() => void} followPlannedPath
 * @property {(agent: import("./slam-agent").Agent) => void} shareMemoryWithAgent
 */

/**
 * Chooses agent actions based on given input data.
 * @param {AgentInputs} inputs
 * @param {AgentActions} actions
 */
export const agentPeriodic = (inputs, actions) => {
	// Take no actions if we have reached the goal
	if (inputs.isAtGoal) return

	if (inputs.hasNearbyAgents)
		inputs.agentDetections.forEach(({agent}) =>
			actions.shareMemoryWithAgent(agent)
		)

    actions.followPlannedPath()
}

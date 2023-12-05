/**
 * The inputs to an agent's decision-making process
 * @typedef {Object} AgentInputs
 * @property {boolean} hasNearbyAgents
 * @property {object[]} agentDetections
 * @property {boolean} isAtTarget
 * @property {object} memory
 * @property {boolean} targetReachable
 * @property {boolean} foundEnd
 * @property {boolean} notAllAgentsKnowEnd
 */

/**
 * The possible results of an agent's decision-making process
 * @typedef {Object} AgentActions
 * @property {() => void} followPlannedPath
 * @property {(agent: import("./slam-agent").Agent) => void} shareMemoryWithAgent
 * @property {() => void} sampleNewTarget
 * @property {() => void} targetEndPosition
 * @property {() => void} targetNearestAgent
 */

/**
 * Chooses agent actions based on given input data.
 * @param {AgentInputs} inputs
 * @param {AgentActions} actions
 */
export const agentPeriodic = (inputs, actions) => {
	// When we find the end, inform others
	if (inputs.foundEnd) {
		if (inputs.notAllAgentsKnowEnd) {
			actions.targetNearestAgent()
		} else {
			actions.targetEndPosition()
		}
	}

	// Pick a new direction if we have reached the target
	else if (inputs.isAtTarget || !inputs.targetReachable) {
		actions.sampleNewTarget()
	}

	// Share information with all nearby agents
	if (inputs.hasNearbyAgents)
		inputs.agentDetections.forEach(({ agent }) =>
			actions.shareMemoryWithAgent(agent)
		)

	actions.followPlannedPath()
}


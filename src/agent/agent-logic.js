/**
 * The inputs to an agent's decision-making process
 * @typedef {Object} AgentInputs
 * @property {boolean} hasNearbyAgents
 * @property {object[]} agentDetections
 * @property {boolean} isAtTarget
 * @property {object} memory
 * @property {boolean} targetReachable
 * @property {boolean} foundEnd
 */

/**
 * The possible results of an agent's decision-making process
 * @typedef {Object} AgentActions
 * @property {() => void} followPlannedPath
 * @property {(agent: import("./slam-agent").Agent) => void} shareMemoryWithAgent
 * @property {() => void} sampleNewTarget
 * @property {() => void} targetEndPosition
 */

/**
 * Chooses agent actions based on given input data.
 * @param {AgentInputs} inputs
 * @param {AgentActions} actions
 */
export const agentPeriodic = (inputs, actions) => {
	// If we have found the end, stay there
	if (inputs.foundEnd) {
		actions.targetEndPosition()
	}
	// Take no actions if we have reached the target
	else if (inputs.isAtTarget || !inputs.targetReachable) {
		actions.sampleNewTarget()
	}

	if (inputs.hasNearbyAgents)
		inputs.agentDetections.forEach(({agent}) =>
			actions.shareMemoryWithAgent(agent)
		)

    actions.followPlannedPath()
}

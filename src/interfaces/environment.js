import { createEmptyOccupancyGrid } from "./grid"

/**
 * @typedef {Object} EnvironmentSensor
 * @property {function(): Position} getPosition - Returns the current position of the sensor in the environment.
 * @property {function(updatedPosition: Position): void} movePosition - Updates the current position of the sensor in the environment and updates the internal map.
 * @property {function(observations: Observation[]): void} receiveObservations - Updates the internal map with the given observations.
 * @property {function(): OccupancyGrid} getInternalMap - Returns the internal map of the environment.
 * @property {function(): Observation[]} getAllObservations - Returns all observations made by the sensor.
 */

/**
 * Creates a sensor that is responsible for exposing information about the environment to an agent.
 * @param {OccupancyGrid} occupancyGrid the occupancy grid interface to base observations on.
 * @param {Position} startPosition the starting position of the sensor in the environment
 * @param {number} visibleRadius the distance the sensor can see (in grid cells)
 * @returns {EnvironmentSensor} the environment sensor
 */
export const createEnvironmentSensor = (
	occupancyGrid,
	startPosition,
	visibleRadius
) => {
	// Store the current position of the agent
	let currentPosition = startPosition

	// Create the internal map, which will be updated through observations
	const [rows, cols] = occupancyGrid.getDimensions()
	const internalMap = createEmptyOccupancyGrid(rows, cols)

	const receiveObservations = (observations) =>
		internalMap.updateWithObservations(observations)

	// Update the internal map by observing the surrounding area
	const updateLocalObservation = () => {
		const localObservation = occupancyGrid.getRectObservation(
			currentPosition,
			visibleRadius
		)

		receiveObservations(localObservation)
	}

	// Explore the initial surrounding area
	updateLocalObservation()

	// Create getter and setter methods for the current position
	const getPosition = () => currentPosition
	const movePosition = (updatedPosition) => {
		// Update the current position
		currentPosition = updatedPosition

		// Update the internal map
		updateLocalObservation()
	}

	const getInternalMap = () => internalMap
	const getAllObservations = () => internalMap.getAllObservations()

	return {
		getPosition,
		movePosition,
		receiveObservations,
		getInternalMap,
		getAllObservations,
	}
}

/**
 * @typedef {Object} CommunicationSensor
 * @property {function} detectAgentsWithinRadius - Detects other agents within a given radius
 * @property {function} shareMemoryWithAgent - Shares memory with another agent
 */

/**
 * Creates a sensor that is responsible for sending communication information to and from the agent
 * @param {number} agentId
 * @param {AgentManager} agentManager
 * @returns {CommunicationSensor} the communication sensor
 */
export const createCommunicationSensor = (agentId, agentManager) => {
	const agent = () => agentManager.getAgent(agentId)

	const distanceToAgent = (otherAgent) => {
		const [row, col] = agent().getPosition().getCoordinate()
		const [_row, _col] = otherAgent.getPosition().getCoordinate()

		return Math.abs(row - _row) + Math.abs(col - _col)
	}

	const detectAgentsWithinRadius = (radius) => {
		const localAgents = []

		for (const _agent of agentManager.getOtherAgents(agentId)) {
			const distance = distanceToAgent(_agent)

			if (distance <= radius)
				localAgents.push({ distance, agent: _agent })
		}

		return localAgents
	}

	const shareMemoryWithAgent = (otherAgent) => {
		otherAgent.receiveMemory(agent().makeMemoryPacket())
	}

	return { detectAgentsWithinRadius, shareMemoryWithAgent }
}


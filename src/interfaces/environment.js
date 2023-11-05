import { createEmptyOccupancyGrid } from "./grid"

/**
 * Creates a sensor that is responsible for exposing information about the environment to an agent.
 * @param {OccupancyGrid} occupancyGrid the occupancy grid interface to base observations on.
 * @param {Position} startPosition the starting position of the sensor in the environment
 * @param {number} visibleRadius the distance the sensor can see (in grid cells)
 * @returns the environment sensor
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
 * Creates a sensor that is responsible for sending communication information to and from the agent
 * @param {number} agentIndex
 * @param {Agent[]} agents
 * @returns {CommunicationSensor} the communication sensor
 */
export const createCommunicationSensor = (agentIndex, agents) => {
	const agent = () => agents[agentIndex]

	const distanceToAgent = (otherAgent) => {
		const [row, col] = agent().getPosition().getCoordinate()
		const [_row, _col] = otherAgent.getPosition().getCoordinate()

		return Math.abs(row - _row) + Math.abs(col - _col)
	}

	const detectAgentsWithinRadius = (radius) => {
		const localAgents = []

		for (const [i, _agent] of Object.entries(agents)) {
			//Skip this agent
			if (i == agentIndex) continue

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


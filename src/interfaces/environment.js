import { createDensityQuadtree } from "../data-structures/density-quadtree"
import { createPosition } from "./components"
import { createEmptyOccupancyGrid } from "./grid"

/**
 * @typedef {Object} EnvironmentSensor
 * @property {function(): Position} getPosition - Returns the current position of the sensor in the environment.
 * @property {function(updatedPosition: Position): void} movePosition - Updates the current position of the sensor in the environment and updates the internal map.
 * @property {function(observations: Observation[]): void} receiveObservations - Updates the internal map with the given observations.
 * @property {function(): OccupancyGrid} getInternalMap - Returns the internal map of the environment.
 * @property {function(): Observation[]} getAllObservations - Returns all observations made by the sensor.
 * @property {function} sampleLowestDensity - Returns a random point from the least explored region.
 * @property {function} foundEndPosition - Returns whether or not the end position has been located.
 * @property {function} getEndPosition - Returns the end position or null if it hasn't been found.
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

	// Create a density quadtree to track the least dense regions of the map,
	// the most fit for exploration
	const densityQuadtree = createDensityQuadtree(rows, cols)

	const receiveObservations = (observations) => {
		// Filter the observations (not necessary for the
		// internal map update but for the quadtree).
		const newObservations = internalMap.filterNewObservations(observations)

		// Update the internal map with new observations
		internalMap.updateWithObservations(newObservations)

		// Update the density quadtree
		newObservations.forEach(({ index }) =>
			densityQuadtree.addPosition(index)
		)
	}

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

	const sampleLowestDensity = () => {
		const lowestDensityRegion = densityQuadtree.findMinDensity()

		const { startRow, endRow, startCol, endCol } = lowestDensityRegion.range

		return sampleRegion(startRow, endRow, startCol, endCol)
	}

	const getEndPosition = () => internalMap.getEndPosition()
	const foundEndPosition = () => getEndPosition() !== null

	return {
		getPosition,
		movePosition,
		receiveObservations,
		getInternalMap,
		getAllObservations,
		sampleLowestDensity,
		foundEndPosition,
		getEndPosition,
	}
}

/**
 * Chooses a random position from within the given region.
 * @param {number} startRow
 * @param {number} endRow
 * @param {number} startCol
 * @param {number} endCol
 * @returns The randomly chosen position
 */
export const sampleRegion = (startRow, endRow, startCol, endCol) => {
	const randomRow =
		Math.floor(Math.random() * (endRow - startRow + 1)) + startRow
	const randomCol =
		Math.floor(Math.random() * (endCol - startCol + 1)) + startCol
	return createPosition(randomRow, randomCol)
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
export const createCommunicationSensor = (getAgent, getOtherAgents) => {
	const distanceToAgent = (otherAgent) => {
		const [row, col] = getAgent().getPosition().getCoordinate()
		const [_row, _col] = otherAgent.getPosition().getCoordinate()

		return Math.abs(row - _row) + Math.abs(col - _col)
	}

	const detectAgentsWithinRadius = (radius) => {
		const localAgents = []

		for (const _agent of getOtherAgents()) {
			const distance = distanceToAgent(_agent)

			if (distance <= radius)
				localAgents.push({ distance, agent: _agent })
		}

		return localAgents
	}

	const shareMemoryWithAgent = (otherAgent) => {
		otherAgent.receiveMemory(getAgent().makeMemoryPacket())
	}

	return { detectAgentsWithinRadius, shareMemoryWithAgent }
}


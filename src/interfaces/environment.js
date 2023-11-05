import { createEmptyOccupancyGrid } from "./grid"

/**
 * Creates a sensor that is responsible for exposing information about the environment to an agent.
 * @param {OccupancyGrid} occupancyGrid the occupancy grid interface to base observations on.
 * @param {Position} startPosition the starting position of the sensor in the environment
 * @param {number} visibleRadius the distance the sensor can see (in grid cells)
 * @returns the environment sensor
 */
export const createEnvironmentSensor = (occupancyGrid, startPosition, visibleRadius) => {
	// Store the current position of the agent
	let currentPosition = startPosition

	// Create the internal map, which will be updated through observations
	const [rows, cols] = occupancyGrid.getDimensions()
	const internalMap = createEmptyOccupancyGrid(rows, cols)

	// Update the internal map by observing the surrounding area
	const updateLocalObservation = () => {
		const localObservation = occupancyGrid.getRectObservation(
			currentPosition,
			visibleRadius
		)

		internalMap.updateWithObservations(localObservation)
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

	return { getPosition, movePosition, getInternalMap }
}

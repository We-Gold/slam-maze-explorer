import { solveAStarGrid, AStarHeuristic } from "algernon-js"
import { createPath, createPosition } from "./components"

/**
 * Converts a path in the format [[x,y]] to [Position]
 * @param {number[][]} indexPath a path made of [x, y] values
 * @returns {Path}
 */
export const convertCoordsToPath = (indexPath) =>
	createPath(indexPath.map(([row, col]) => createPosition(row, col)))

/**
 * Represents a motion plan containing the next position in the path and the complete future plan.
 * @typedef {Object} MotionPlan
 * @property {Position} nextPosition - The next position in the path.
 * @property {Path} futurePath - The complete future plan.
 */

/**
 * Creates a motion plan based on a given map, a current location, and a goal location.
 * @param {OccupancyGrid} occupancyGrid
 * @param {Position} currentPosition
 * @param {Position} goalPosition
 * @returns {MotionPlan} an object containing the next position in the path and the complete future plan
 */
export const createMotionPlan = (
	occupancyGrid,
	currentPosition,
	goalPosition
) => {
	// Avoid expensive calculations when no motion is necessary
	if (currentPosition.equals(goalPosition))
		return { nextPosition: currentPosition, futurePath: createPath([]) }

	const [_, nextPosition, ...futurePath] = convertCoordsToPath(
		solveAStarGrid(
			occupancyGrid.getGrid(),
			currentPosition.getCoordinate(),
			goalPosition.getCoordinate(),
			AStarHeuristic.manhattan
		)
	).getPositions()

	return {
		nextPosition,
		futurePath: createPath(futurePath),
	}
}

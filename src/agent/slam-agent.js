import { createPath } from "../interfaces/components"
import { createEnvironmentSensor } from "../interfaces/environment"
import { createMotionPlan } from "../interfaces/motion-planner"

/**
 * Create a SLAM agent that
 * @param {OccupancyGrid} occupancyGrid
 * @param {Position} startPosition
 * @param {Position} goalPosition
 * @param {CommunicationSensor} communicationSensor
 * @param {number} visibleRadius
 * @returns {Agent}
 */
export const createSLAMAgent = (
	occupancyGrid,
	startPosition,
	goalPosition,
	communicationSensor,
	visibleRadius = 2
) => {
	const environmentSensor = createEnvironmentSensor(occupancyGrid, startPosition, visibleRadius)

	// Store the path the agent has taken
	let agentPath = createPath([startPosition])

	const getAgentPath = () => agentPath
	const getInternalMap = () => environmentSensor.getInternalMap()
	const getPosition = () => environmentSensor.getPosition()
	const getGoalPosition = () => goalPosition
	const setGoalPosition = (updatedGoal) => {
		// Update the goal position
		goalPosition = updatedGoal
	}
	const makeMemoryPacket = () => {
		return {
			observations: environmentSensor.getAllObservations(),
			position: getPosition(),
			targetPosition: null
		}
	}
	const receiveMemory = (memoryPacket) => {
		environmentSensor.receiveObservations(memoryPacket.observations)
	}

	const moveWithPlanner = () => {
		const motionPlan = createMotionPlan(getInternalMap(), getPosition(), getGoalPosition())

		// No need to move if we are at the goal
		if (motionPlan.futurePath.length() === 0)
			return motionPlan.futurePath

		const detections = communicationSensor.detectAgentsWithinRadius(visibleRadius)
		if (detections.length > 0) {
			communicationSensor.shareMemoryWithAgent(detections[0].agent)
		}

		// Move to the next position in the path
		environmentSensor.movePosition(motionPlan.nextPosition)

		// Store the current point as part of the route
		agentPath.add(motionPlan.nextPosition)

		return motionPlan.futurePath
	}

	return {
		getPosition,
		setGoalPosition,
		getGoalPosition,
		getAgentPath,
		getInternalMap,
		makeMemoryPacket,
		receiveMemory,
		moveWithPlanner,
	}
}
import { createPath } from "../interfaces/components"
import { createEnvironmentSensor } from "../interfaces/environment"
import { createMotionPlan } from "../interfaces/motion-planner"
import { agentPeriodic } from "./agent-logic"

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
	const environmentSensor = createEnvironmentSensor(
		occupancyGrid,
		startPosition,
		visibleRadius
	)

	// Store the path the agent has taken
	let pastAgentPath = createPath([startPosition])

	// Store the path the agent will take
	let futureAgentPath = createPath([])

	const getAgentPath = () => pastAgentPath
	const getFuturePath = () => futureAgentPath
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
			targetPosition: null,
		}
	}
	const receiveMemory = (memoryPacket) => {
		environmentSensor.receiveObservations(memoryPacket.observations)
	}

	const act = () => {
		const detections =
			communicationSensor.detectAgentsWithinRadius(visibleRadius)

		const inputs = {
			hasNearbyAgents: detections.length > 0,
			agentDetections: detections,
			isAtGoal: getPosition().equals(getGoalPosition()),
		}

		const actions = {
			followPlannedPath: () => {
				const motionPlan = createMotionPlan(
					getInternalMap(),
					getPosition(),
					getGoalPosition()
				)

				// Move to the next position in the path
				environmentSensor.movePosition(motionPlan.nextPosition)

				// Store the current point as part of the route
				pastAgentPath.add(motionPlan.nextPosition)

				futureAgentPath = motionPlan.futurePath
			},
			shareMemoryWithAgent: (agent) => {
				communicationSensor.shareMemoryWithAgent(agent)
			},
		}

		agentPeriodic(inputs, actions)
	}

	return {
		getPosition,
		setGoalPosition,
		getGoalPosition,
		getAgentPath,
		getFuturePath,
		getInternalMap,
		makeMemoryPacket,
		receiveMemory,
		act,
	}
}


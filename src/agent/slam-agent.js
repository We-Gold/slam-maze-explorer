import { createPath } from "../interfaces/components"
import { createEnvironmentSensor } from "../interfaces/environment"
import { createMotionPlan } from "../interfaces/motion-planner"
import { agentPeriodic } from "./agent-logic"

/**
 * A SLAM agent that can navigate a maze-like environment and build an internal map of the environment.
 * @typedef {Object} Agent
 * @property {function} getId - Returns the agent's id.
 * @property {function} getPosition - Returns the current position of the agent.
 * @property {function} setGoalPosition - Sets the goal position for the agent to navigate to.
 * @property {function} getGoalPosition - Returns the current goal position of the agent.
 * @property {function} getAgentPath - Returns the path the agent has taken so far.
 * @property {function} getFuturePath - Returns the path the agent plans to take.
 * @property {function} getInternalMap - Returns the internal map of the environment built by the agent.
 * @property {function} makeMemoryPacket - Creates a memory packet containing the agent's observations and current position.
 * @property {function} receiveMemory - Receives a memory packet from another agent and updates its internal map.
 * @property {function} act - Performs an action based on the agent's current state and environment.
 */

/**
 * Creates a SLAM agent that can navigate a maze-like environment and build an internal map of the environment.
 * @param {number} id
 * @param {OccupancyGrid} occupancyGrid
 * @param {Position} startPosition
 * @param {CommunicationSensor} communicationSensor
 * @param {number} visibleRadius
 * @param {number} communicationRadius
 * @returns {Agent}
 */
export const createSLAMAgent = (
	id,
	occupancyGrid,
	startPosition,
	communicationSensor,
	visibleRadius,
	communicationRadius
) => {
	const environmentSensor = createEnvironmentSensor(
		occupancyGrid,
		startPosition,
		visibleRadius
	)

	const interactionMemory = createAgentMemory()

	// Make a guess at the goal location
	let goalPosition = environmentSensor.sampleLowestDensity()

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
			source: id,
			observations: environmentSensor.getAllObservations(),
			position: getPosition(),
			targetPosition: getGoalPosition(),
		}
	}
	const receiveMemory = (memoryPacket) => {
		interactionMemory.recordInteraction(memoryPacket)
		environmentSensor.receiveObservations(memoryPacket.observations)
	}

	const followPathToGoal = (goal) => {
		const motionPlan = createMotionPlan(
			getInternalMap(),
			getPosition(),
			goal
		)

		// Cannot do not move if no path exists to the goal
		if (motionPlan.nextPosition == null || motionPlan.nextPosition == undefined) {
			return
		}

		// Move to the next position in the path
		environmentSensor.movePosition(motionPlan.nextPosition)

		// Store the current point as part of the route
		pastAgentPath.add(motionPlan.nextPosition)

		futureAgentPath = motionPlan.futurePath
	}

	const pathExistsToPosition = (position) => {
		const motionPlan = createMotionPlan(
			getInternalMap(),
			getPosition(),
			position
		)

		// Cannot do not move if no path exists to the goal
		if (motionPlan.nextPosition == null || motionPlan.nextPosition == undefined) {
			return false
		}

		return true
	}

	const act = () => {
		const detections =
			communicationSensor.detectAgentsWithinRadius(communicationRadius)

		const inputs = {
			hasNearbyAgents: detections.length > 0,
			agentDetections: detections,
			isAtGoal: getPosition().equals(getGoalPosition()),
			memory: interactionMemory,
			goalReachable: pathExistsToPosition(getGoalPosition())
		}

		const actions = {
			followPlannedPath: () => {
				followPathToGoal(getGoalPosition())
			},
			sampleNewTarget: () => {
				setGoalPosition(environmentSensor.sampleLowestDensity())
			},
			shareMemoryWithAgent: (agent) => {
				communicationSensor.shareMemoryWithAgent(agent)
			},
		}

		agentPeriodic(inputs, actions)
	}

	return {
		getId: () => id,
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

const createAgentMemory = () => {
	const memory = {}

	const recordInteraction = (memoryPacket) => {
		memory[memoryPacket.source] = {
			position: memoryPacket.position,
			targetPosition: memoryPacket.targetPosition,
		}
	}

	const getLastPositionOfAgent = (agentId) => {
		return memory[agentId].position
	}

	const getTargetPositionOfAgent = (agentId) => {
		return memory[agentId].targetPosition
	}

	return {
		recordInteraction,
		getLastPositionOfAgent,
		getTargetPositionOfAgent,
	}
}


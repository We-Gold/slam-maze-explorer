import { createPath, manhattanDistance } from "../interfaces/components"
import { createEnvironmentSensor } from "../interfaces/environment"
import { createMotionPlan } from "../interfaces/motion-planner"
import { agentPeriodic } from "./agent-logic"

/**
 * A SLAM agent that can navigate a maze-like environment and build an internal map of the environment.
 * @typedef {Object} Agent
 * @property {function} getId - Returns the agent's id.
 * @property {function} getPosition - Returns the current position of the agent.
 * @property {function} setTargetPosition - Sets the target position for the agent to navigate to.
 * @property {function} getTargetPosition - Returns the current target position of the agent.
 * @property {function} getAgentPath - Returns the path the agent has taken so far.
 * @property {function} getFuturePath - Returns the path the agent plans to take.
 * @property {function} getInternalMap - Returns the internal map of the environment built by the agent.
 * @property {function} makeMemoryPacket - Creates a memory packet containing the agent's observations and current position.
 * @property {function} receiveMemory - Receives a memory packet from another agent and updates its internal map.
 * @property {function} act - Performs an action based on the agent's current state and environment.
 * @property {function} foundEnd - returns true if the agent has located the end of the maze
 * @property {funciton} collectDensityRanges - Returns a sequence of density readings
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

	// Make a guess at the target location
	let targetPosition = environmentSensor.sampleLowestDensity()

	// Store the path the agent has taken
	let pastAgentPath = createPath([startPosition])

	// Store the path the agent will take
	let futureAgentPath = createPath([])

	const getAgentPath = () => pastAgentPath
	const getFuturePath = () => futureAgentPath
	const getInternalMap = () => environmentSensor.getInternalMap()
	const getPosition = () => environmentSensor.getPosition()
	const getTargetPosition = () => targetPosition
	const setTargetPosition = (updatedTarget) => {
		// Update the target position
		targetPosition = updatedTarget
	}
	const makeMemoryPacket = () => {
		return {
			source: id,
			observations: environmentSensor.getAllObservations(),
			position: getPosition(),
			targetPosition: getTargetPosition(),
			foundEnd: environmentSensor.foundEndPosition(),
		}
	}
	const receiveMemory = (memoryPacket) => {
		interactionMemory.recordInteraction(memoryPacket)
		environmentSensor.receiveObservations(memoryPacket.observations)
	}

	const followPathToTarget = (target) => {
		const motionPlan = createMotionPlan(
			getInternalMap(),
			getPosition(),
			target
		)

		// Cannot do not move if no path exists to the target
		if (
			motionPlan.nextPosition == null ||
			motionPlan.nextPosition == undefined
		) {
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

		// Cannot do not move if no path exists to the target
		if (
			motionPlan.nextPosition == null ||
			motionPlan.nextPosition == undefined
		) {
			return false
		}

		return true
	}

	const act = () => {
		const detections =
			communicationSensor.detectAgentsWithinRadius(communicationRadius)

		const nearestAgent = interactionMemory.findClosestAgent(
			getPosition(),
			false
		)

		const inputs = {
			hasNearbyAgents: detections.length > 0,
			agentDetections: detections,
			isAtTarget: getPosition().equals(getTargetPosition()),
			memory: interactionMemory,
			targetReachable: pathExistsToPosition(getTargetPosition()),
			foundEnd: environmentSensor.foundEndPosition(),
			notAllAgentsKnowEnd: nearestAgent !== null,
		}

		const actions = {
			followPlannedPath: () => {
				followPathToTarget(getTargetPosition())
			},
			sampleNewTarget: () => {
				setTargetPosition(environmentSensor.sampleLowestDensity())
			},
			targetEndPosition: () => {
				const end = environmentSensor.getEndPosition()
				if (end !== null) setTargetPosition(end)
			},
			targetNearestAgent: () => {
				if (nearestAgent === null) return

				const predictedPosition =
					interactionMemory.getPredictedPosition(nearestAgent)

				// Mark the agent's position as visited if we have arrived
				if (
					predictedPosition.equals(getPosition()) ||
					!pathExistsToPosition(predictedPosition)
				) {
					interactionMemory.visitAgentPosition(nearestAgent)
				}

				// Search for the agent where we expect them to be
				setTargetPosition(predictedPosition)
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
		setTargetPosition,
		getTargetPosition,
		getAgentPath,
		getFuturePath,
		getInternalMap,
		makeMemoryPacket,
		receiveMemory,
		act,
		foundEnd: environmentSensor.foundEndPosition,
		collectDensityRanges: environmentSensor.collectDensityRanges
	}
}

const createAgentMemory = () => {
	const memory = {}

	const recordInteraction = (memoryPacket) => {
		const { source, position, targetPosition, foundEnd } = memoryPacket

		// Merge the current memory with new information
		memory[source] = {
			...memory[source],
			...{
				position,
				targetPosition,
				foundEnd,
			},
		}
	}

	const getLastPositionOfAgent = (agentId) => memory[agentId].position
	const getTargetPositionOfAgent = (agentId) => memory[agentId].targetPosition

	/**
	 * Predicts the location of the agent based on how much we have looked for it,
	 * or returns null if we have already checked all locations
	 */
	const getPredictedPosition = (agentId) => {
		if (memory[agentId]?.visitedCurrent) return null
		else if (memory[agentId]?.visitedTarget)
			return getLastPositionOfAgent(agentId)
		else return getTargetPositionOfAgent(agentId)
	}

	/**
	 * Records a visit to one of the agent's known positions
	 */
	const visitAgentPosition = (agentId) => {
		if (memory[agentId]?.visitedTarget)
			memory[agentId].visitedCurrent = true
		else memory[agentId].visitedTarget = true
	}

	/**
	 * Finds the closest agent (based on target location) to this agent.
	 * @param {Position} agentPosition The position of this agent
	 * @param {boolean} [knowsEnd] Whether or not the agent knows the end position.
	 * @returns {any|null} The id of the closest agent or null if none match the criteria
	 */
	const findClosestAgent = (agentPosition, knowsEnd = false) => {
		let closestId = null
		let closestDistance = Number.POSITIVE_INFINITY

		for (const [id, packet] of Object.entries(memory)) {
			const hasCorrectMemory = packet.foundEnd === knowsEnd
			const distance = manhattanDistance(
				agentPosition,
				packet.targetPosition
			)
			const hasBeenVisited = getPredictedPosition(id) === null

			if (
				hasCorrectMemory &&
				distance < closestDistance &&
				!hasBeenVisited
			) {
				closestId = id
				closestDistance = distance
			}
		}

		return closestId
	}

	return {
		recordInteraction,
		getLastPositionOfAgent,
		getTargetPositionOfAgent,
		findClosestAgent,
		getPredictedPosition,
		visitAgentPosition,
	}
}


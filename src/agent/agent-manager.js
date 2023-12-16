import { createSLAMAgent } from "./slam-agent"
import { createCommunicationSensor } from "../interfaces/environment"

/**
 * Creates an object to manage all of the agents in the system.
 * @typedef {Object} AgentManager
 * @property {function} getAgent - Retrieves the agent with the given id.
 * @property {function} makeAgent - Creates an agent in this agent manager.
 * @property {function} getAllAgents - Gets all agents in the manager.
 * @property {function} act - Calls act on all managed agents.
 */

/**
 * Creates an agent manager object.
 * @returns {AgentManager} An object with methods to manage agents.
 */
export const createAgentManager = ({commsRadius, visibleRadius}) => {
	const agents = []

	/**
	 * Adds an agent to the manager.
	 * @param {Object} agent - The agent to add.
	 */
	const addAgent = (agent) => agents.push(agent)

	/**
	 * Gets an agent from the manager.
	 * @param {number} agentId - The ID of the agent to get.
	 * @returns {Object} The agent with the specified ID.
	 */
	const getAgent = (agentId) => agents[agentId]

	/**
	 * Gets the ID for the next agent to be added.
	 * @returns {number} The ID for the next agent.
	 */
	const getNextAgentId = () => agents.length

	/**
	 * Gets all agents except for the one with the specified ID.
	 * @param {number} agentId - The ID of the agent to exclude.
	 * @returns {Array} An array of agents.
	 */
	const getOtherAgents = (agentId) => {
		return agents.filter((_, i) => i !== agentId)
	}

	/**
	 * Creates a getter method to access the next added agent
	 * @returns A method that returns the next added agent
	 */
	const createGetAgentMethod = () => {
		const agentId = getNextAgentId()

		return () => getAgent(agentId)
	}

	/**
	 * Creates a method that gets all agents but the next one added
	 * @returns A method that gets all agents but the next one added
	 */
	const createGetOtherAgentsMethod = () => {
		const agentId = getNextAgentId()

		return () => getOtherAgents(agentId)
	}

	/**
	 * Creates an agent in this agent manager
	 * @param {OccupancyGrid} grid
	 * @param {Position} startPosition
     * @returns {Agent} the constructed agent
	 */
	const makeAgent = (grid, startPosition) => {
		const agent = createSLAMAgent(
			getNextAgentId(),
			grid,
			startPosition,
			createCommunicationSensor(
				createGetAgentMethod(),
				createGetOtherAgentsMethod()
			),
			visibleRadius,
			commsRadius
		)

		addAgent(agent)

		return agent
	}

	/**
	 * Gets all agents in the manager.
	 * @returns {Array} An array of agents.
	 */
	const getAllAgents = () => agents

	/**
	 * Calls act on all managed agents.
	 */
	const act = () => agents.forEach((agent) => agent.act())

	return { makeAgent, getAgent, getAllAgents, act }
}


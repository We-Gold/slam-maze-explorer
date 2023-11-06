/**
 * Creates an object to manage all of the agents in the system.
 * @typedef {Object} AgentManager
 * @property {function} addAgent - Adds an agent to the manager.
 * @property {function} getAgent - Gets an agent from the manager.
 * @property {function} getNextAgentId - Gets the ID for the next agent to be added.
 * @property {function} getOtherAgents - Gets all agents except for the one with the specified ID.
 * @property {function} getAllAgents - Gets all agents in the manager.
 */

/**
 * Creates an agent manager object.
 * @returns {AgentManager} An object with methods to manage agents.
 */
export const createAgentManager = () => {
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
     * Gets all agents in the manager.
     * @returns {Array} An array of agents.
     */
    const getAllAgents = () => agents

    return { addAgent, getAgent, getNextAgentId, getOtherAgents, getAllAgents }
}

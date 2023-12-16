export const createConfiguration = (
	agents,
	mazeSize,
	visibleRadius,
	commsRadius
) => ({
	agents,
	mazeSize,
	visibleRadius,
	commsRadius,
})

export const createStateManager = () => {
	// Store references to the numeric configuration elements
	const agentsConfig = createNumericalConfig("agents", 1, 5)
	const mazeSizeConfig = createNumericalConfig("maze-size", 20, 100, 2)
	const visibleRadiusConfig = createNumericalConfig("visible-radius", 1, 10)
	const commsRadiusConfig = createNumericalConfig("comms-radius", 1, 10)

	// TODO: Store references to the color configuration elements

	const getConfigurationCallback = () =>
		createConfiguration(
			agentsConfig.get(),
			mazeSizeConfig.get(),
			visibleRadiusConfig.get(),
			commsRadiusConfig.get()
		)

	/* Handle Starting Simulation */
	const beginSimulationButton = document.querySelector("#start-sim-btn")
	let beginSimButtonCallback = () => {}
	const setBeginSimButtonCallback = (_callback) => {
        // Create a callback that gives the caller access to the current configuration and the simulation button
		const callback = () => _callback(beginSimulationButton, getConfigurationCallback())

		beginSimulationButton.removeEventListener(
			"click",
			beginSimButtonCallback
		)
		beginSimulationButton.addEventListener("click", callback)

		beginSimButtonCallback = callback
	}

	return { setBeginSimButtonCallback }
}

const constrain = (input, min, max) => Math.min(Math.max(input, min), max)

const createNumericalConfig = (baseId, min, max, inc = 1) => {
	const displayElement = document.getElementById(baseId + "-config")
	const incrementElement = document.getElementById(baseId + "-config-inc")
	const decrementElement = document.getElementById(baseId + "-config-dec")

	let state = +displayElement.textContent

	incrementElement.addEventListener("click", () => {
		state = constrain(state + inc, min, max)
		displayElement.textContent = state
	})

	decrementElement.addEventListener("click", () => {
		state = constrain(state - inc, min, max)
		displayElement.textContent = state
	})

	return {
		get: () => state,
	}
}

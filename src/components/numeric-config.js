const constrain = (input, min, max) => Math.min(Math.max(input, min), max)

export const createNumericalConfig = (label, initial, min, max, inc = 1) => {
	const baseElement = document.createElement("div")
	baseElement.className = "numeric-config"

	// Create the label element
	const labelElement = document.createElement("span")
	labelElement.className = "config-label"
	labelElement.textContent = label
	baseElement.appendChild(labelElement)

	// Create a container to hold the rest of the configuration options
	const container = document.createElement("span")
	baseElement.appendChild(container)

	// Create the number container
	const displayElement = document.createElement("span")
	displayElement.className = "pill primary-text"
	displayElement.textContent = initial
	container.appendChild(displayElement)

	// Create the controls elements
	const controlsContainer = document.createElement("span")
	controlsContainer.className = "controls"
	container.appendChild(controlsContainer)

	const incrementElement = document.createElement("span")
	incrementElement.className = "pill"
	incrementElement.textContent = "+"
	controlsContainer.appendChild(incrementElement)

	const decrementElement = document.createElement("span")
	decrementElement.className = "pill"
	decrementElement.textContent = "-"
	controlsContainer.appendChild(decrementElement)

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
		element: baseElement,
		get: () => state,
	}
}


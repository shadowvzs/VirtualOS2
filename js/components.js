const componentData = {
	settings: {
		taskManager: {
			id: "tskmngr",
			name: "System Taskbar",
			description: "Responsable for managing the taskbar",
			icon: "",
			visible: true,
			maxProc: 1,
			movable: false,
			focusable: false,
		},
		clockManager: {
			id: "clkmngr",
			name: "System Clock",
			description: "Responsable for keep time realated parts like right side clock",
			icon: "",
			visible: true,
			maxProc: 1,
			movable: false,
			focusable: false,
			showUI: true,
			placeholder: "time#clock",

		},
	},
	classes: {
		taskManager(settings, req = false) {
			console.log(settings);

			return {
				remove() {

				}
			}
		},
		clockManager(settings, req = false) {

			let timerId;
			if (settings.showUI) {
				const placeholder = document.body.querySelector(settings.placeholder);
				if (placeholder) {
					timerId =  setInterval( () => {
						placeholder.textContent = formattedTime();
					}, 1000);
				}
			}

			function formattedTime() {
				const time = new Date();
				return (
					("0" + time.getHours()).slice(-2)   + ":" +
					("0" + time.getMinutes()).slice(-2) + ":" +
					("0" + time.getSeconds()).slice(-2)
				);
			}

			return {
				remove() {
					if (timerId) {
						clearInterval(timerId);
					}
				}
			}
		}
	},
}

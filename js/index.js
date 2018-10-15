const core = Object.freeze(new Core());

function Core() {
	const head = document.querySelector("head");
	let components = {};

	loadScript("script", "components", () => {
		const {settings, classes} = componentData,
			keys = Object.keys(settings),
			param = ['component', 'options'];
		let component, options;
		for (const key of keys) {
			component = classes[key] || false;
			options = settings[key] || false;
			if (!options || !component) { continue; }
			options.constructorName = key;
			/**
				i want make a custom script loader system like import with babel
				this is only just an idea and bit hacky but work well:
				1. we can make constructor functions in componentData
				2. we make new function from method with new Function()
				3. now we can construct object from it with new keyword
				4. delete the original script, so our object will be isolated here
			*/
			components[key] = new (new Function(...param, 'return component(options)'))(component, options);
		}
		removeScript("script", "components");
	});

	setTimeout(() => console.log('our loaded components: ', components), 1000);

	document.body.onclick = globalClickHandler;

	function getActionNode (e, max = 3) {
		if (e.dataset.action) {
			return e;
		}

		let  i = 0;
		for (; i < max; i++) {
			e = e.parentNode;
			if (e.dataset.action) {
				return e;
			}
		}
		return null;
	}


	function removeScript(type, name) {
		const e = document.getElementById(`${type}_${name}`);
		if (e) {
			e.remove();
		}
	}

	function globalClickHandler(ev) {
		//e.closest('td')
		let e = getActionNode(ev.target), d;
		if (!e) { return; }
		d = e.dataset;
		if (d.event == true) {
			//ev.preventDefault();
		}

		if (d.action == "toggle") {

			if (!d.target || !d.classname) { return; }
			const target = document.getElementById(d.target);
			if (!target) { return; }
			target.classList.toggle(d.classname);
		}
		console.log(d.action, d);

		//e.stopPropagation();
		//e.preventDefault();
	}

	function getScriptPath(type, name) {
		if (type == "script") {
			return `js/${name}.js`;
		}
		return false;
	}

	function loadScript (type, name, callback = false) {
		const url = getScriptPath(type, name);

		if (!type || !name || !url) {
			return console.log('ERROR: invalid script type or name', type, name);
		}

		const contentType = 'application/x-www-form-urlencoded',
			httpRequest = new XMLHttpRequest();

		httpRequest.onreadystatechange = function(event) {
			if (this.readyState === 4) {
				if (this.status === 200) {
					console.log(this.response);
					const data = document.createElement(type);
					data.innerHTML = this.response;
					data.id = `${type}_${name}`;
					head.insertBefore(data, head.lastChild);
					if ( callback && typeof callback == "function") {
						callback(this.response);
					}
				} else {
					console.log("Script loading failed, maybe file not exist?");
				}
			}
		};

		httpRequest.responseType = 'text';
		httpRequest.open("GET", url, true);
		httpRequest.timeout = 3000;
		httpRequest.send();
	}

}

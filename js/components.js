const componentData = {
	settings: {
		taskManager: {
			id: "tskmngr",
			name: "System Taskbar",
			description: "Responsable for managing the taskbar",
			icon: "",
			launchbar: false,
			taskbar: false,
			maxProc: 1,
			movable: false,
			focusable: false,
		},
		clockManager: {
			id: "clkmngr",
			name: "System Clock",
			description: "Responsable for keep time realated parts like right side clock",
			icon: "",
			launchbar: false,
			taskbar: true,
			maxProc: 1,
			movable: false,
			focusable: false,
			showUI: true,
			placeholder: "time#clock",
		},
		contextMenu: {
			id: "cntxtmn",
			name: "Right Click Menu",
			description: "Responsable for create right click menu from array",
			icon: "",
			launchbar: false,
			taskbar: false,
			width: "auto",
			className: 'contextMenu',
			maxProc: 1,
			movable: false,
			focusable: false,
		},
		virtualClipboard: {
			id: "vrtlclpbrd",
			name: "Clipboard",
			description: "Responsable for register item/items in virtual clipboard",
			icon: "",
			launchbar: false,
			taskbar: false,
			maxProc: 1,
			movable: false,
			focusable: false,
		},
		desktopManager: {
			id: "dsktpmngr",
			name: "Desktop Manager",
			description: "Responsable for create, arrange icons, send data to context menu",
			icon: "",
			launchbar: true,
			taskbar: true,
			maxProc: 1,
			movable: false,
			focusable: false,
			container: '.desktop-container',
			relationship: {
				datasource: 'fileSystem',
				menu: 'contextMenu',
				clipboard: 'virtualClipboard',
				explorer: 'fileExplorer',
				window: 'windowManager',
			}
		},
		startMenuManager: {
			id: "strtmnmngr",
			name: "Start Menu",
			description: "Responsable for start menu",
			icon: "",
			label: "Start",
			placeholder: ".start-menu-button",
			launchbar: false,
			taskbar: false,
			maxProc: 1,
			movable: false,
			focusable: false,
			relationship: {
				datasource: 'fileSystem'
			}
		},
		fileSystem: {
			id: "flsstm",
			name: "File System",
			description: "Responsable for file & folder crud (json data manipulation)",
			icon: "",
			launchbar: false,
			taskbar: false,
			maxProc: 1,
			movable: false,
			focusable: false,
			relationship: {
				desktop: 'desktopManager',
				startmenu: 'startMenuManager',
			},
			database: './vfs.json',
		},
		fileExplorer: {
			id: "flxplrr",
			name: "File Explorer",
			description: "Responsable for browsing in directories",
			windowClass: 'file-explorer',
			icon: "folder",
			launchbar: true,
			taskbar: true,
			maxProc: 20,
			movable: true,
			focusable: true,
			relationship: {
				desktop: 'desktopManager',
				window: 'windowManager',
				datasource: 'fileSystem'
			},
		},
		windowManager: {
			id: "wndwmngr",
			name: "Window Manager",
			description: "Responsable for handle the windows",
			icon: "",
			launchbar: false,
			taskbar: false,
			maxProc: 1,
			movable: false,
			focusable: false,
			contentSelector: '.content',
			relationship: {
				window: 'taskManager',
			},
		},
	},
	classes: {
		taskManager(settings, shared = false) {

			return {
				remove() {

				}
			}
		},
		clockManager(settings, shared = false) {
			const placeholder = document.body.querySelector(settings.placeholder) || null;
			let timerId;
			if (settings.showUI) {
				updateClock(new Date())
				if (placeholder) {
					placeholder.dataset.timezone = getTimeZone();
					timerId =  setInterval( () => {
						updateClock(new Date());
					}, 1000);
				}
			}

			function updateClock(time) {
				const clock = shared.getFormattedTime(time);
				placeholder.textContent = clock;
				placeholder.dataset.time = clock;
				placeholder.dataset.date = shared.getNamedDate(time);
			}

			function getTimeZone() {
				const time = new Date(),
					timeZone = Math.round(time.getTimezoneOffset() / 60);
				return timeZone > 0 ? "-" + timeZone : "+" + -timeZone;
			}

			return {
				remove() {
					if (timerId) {
						clearInterval(timerId);
					}
				}
			}
		},
		contextMenu (settings, shared = false) {
			const width = settings.width || 200,
				id = 'contextmenu_'+Date.now();
			let dom;

			function init() {
				dom = document.createElement("div");
				dom.classList.add(settings.className);
				dom.setAttribute("tabindex","-1");
				dom.style.width = width+'px';
				dom.textContent = "";
				dom.id = id;
				document.body.appendChild(dom);
				dom.addEventListener('blur', blurEvent);
				dom.onclick = function() { setTimeout( blurEvent, 100); };
			}

			function blurEvent() {
				dom.classList.remove('show');
			}

			function moveContextMenu(e) {
				const px = e.pageX,
					  py = e.pageY,
					  cx = dom.offsetWidth,
					  cy = dom.offsetHeight,
				 	  wx = document.body.clientWidth,
	 			  	  wy = document.body.clientHeight;
				let	nx, ny;

				ny = (py+cy > wy) ? (wy-cy > 0 ? wy-cy : 0) : py;
				nx = (px+cx > wx) ? (wx-cx > 0 ? wx-cx : 0) : px;

				dom.style.top = py+'px';
				dom.style.left = ((px+cx > wx) ? (wx-cx > 0 ? wx-cx : 0) : px)+'px';
				dom.classList.add('show');
				dom.focus();
			}

			function populateContextMenu(list, id) {
				let str = "";
				while (dom.firstChild) {dom.removeChild(dom.firstChild)};
				if (list) {
					const ul = document.createElement('ul');
					ul.dataset.id = id;
					for (let row of list) {
						str = `data-click="${row[1]}.${row[2]}." data-extra = "${row[3].join('/')}"`;
						if (!row[1]) {
							str += ` class="disabled"`;
						}
						ul.insertAdjacentHTML('beforeend', `<li ${str}>${row[0]}</li>`);
					}
					dom.appendChild(ul);
				}
			}

			init();

			return {
				getId() {
					return dom.id || false;
				},
				remove() {
					dom.removeEventListener('blur', blurEvent);
				},
				create(e, list = [], id = 0) {
					populateContextMenu(list, id);
					moveContextMenu(e);
					e.preventDefault();
				}
			}
		},
		virtualClipboard(settings, shared = false) {
			const container = document.querySelector(settings.container),
				{ components, isEmpty } = shared;
			let clipboard = [];


			function addItems(e) {
				clipboard.push(...[e.dataset.extra.split("/")]);
				return true;
			}

			return {
				getItems() {
					return clipboard;
				},
				addItems(e, ev) {
					addItems(e);
				},
				clear() {
					clipboard = [];
				}
			}
		},
		desktopManager(settings, shared = false) {
			const defaultContainer = getDOM(settings.container),
				{ guid, sec2Date, getPath, components, isEmpty } = shared,
				cName = settings.constructorName,
				relationship = settings.relationship,
				{datasource: ds, window: win} = relationship;
			let icons = [];

			function createTooltip(item) {
				const child = item.child && item.child.length,
					content = child ?
					`Content: &nbsp; ${child} file(s) or folder(s)&#013;`
					: "";
				return `ID: ${item.id}
					Description: ${item.description}&#013;
					Type: ${item.type}&#013;
					Status: ${item.readonly ? "readonly" : "writeable"}&#013;
					${content}
					Created at: ${sec2Date(item.createtime)}&#013;
					Modified at: ${sec2Date(item.lastmodify)}`.replace(/\t/g,'');
			}

			function CreateDesktopIcon(item, targetContainer = defaultContainer, newWindow = true) {
				targetContainer.insertAdjacentHTML('beforeend', `<div class="de-icon no-select" data-item-id="${item.id}">
					<a title="${createTooltip(item)}" data-click="${ds}.execute" data-contextmenu="${cName}.createMenu" data-id="${item.id}" data-container="${targetContainer.dataset.id}" data-new="${newWindow}" data-type="icon">
						<div class="DesktopIconImgBox">
							<img src="${getPath('desktop', item.icon)}" />
						</div>
					</a>
					<p title="${item.name}">
						<div class="de-text-box icon-text" data-id="${item.id}">
							<input class="d-none" type="text" maxlength="24" value="${item.name}" />
							<a class="d-none" data-click="${cName}.rename">&#10004;</a>
							<a class="d-none" data-click="${cName}.toggleRename">&#10008;</a>
							<span data-click="${cName}.toggleRename">${item.name}</span>
						</div>
					</p>
				</div>`);
			}

			function getContainer(id) {
				const window = components[win].getWindow(id);
				console.log('window', window);
				if (!window) {
					return defaultContainer;
				}
				return window.body;
			}

			function loadContent(list) {
				for (const item of list) {
					CreateDesktopIcon(item);
				}
			}

			function toggleRename(e) {
				const childs = e.children || false;
				if (childs) {
					for (const child of childs) {
						child.classList.toggle('d-none');
						if (child.tagName == "INPUT") {
							child.focus();
							child.select();
						}
					}
				}
			}

			function rename(e) {
				const datasource = components[ds],
					id = e.parentNode.dataset.id || null;
				if (!datasource || !id) {
					return console.log("file system not exist or missing id");
				}
				const vfs = datasource.getDatabase(),
					item = datasource.search(vfs.child, id),
					input = e.parentNode.querySelector("input");
				if (!item || !input) {
					return console.log("file or folder not exist!");
				}


				item.name = input.value;
				if (datasource.save()) {
					const parent = e.parentNode;
						span = parent.querySelector('span');
					if (span) {
						span.textContent = item.name;
					}
					toggleRename(parent);
				}
			}

			function createMenu(e, ev) {
				const { id, container = false, type = "icon" } = e.dataset,
					datasource = components[ds],
					clipboard = components[relationship.clipboard || "null"] || null;
					menu = components[relationship.menu || "null"] || null;

				if (!id || !container) {
					return console.log("Not exist id or container data on this element");
				}

				const vfs = datasource.getDatabase();
				let list;
				if (type == "free") {
					list = [
						["New Folder", cName, "createNew", [id, container, 'dir']],
						["New File", cName, "createNew", [id, container, 'html']],
						["Paste", cName, "paste", [id, container, type]],
					//	["Arrange Icon", relationship.clipboard, "addItems", ['fs', id, 'true']],
						["Terminal", cName, "remove", [id]],
						["Settings", cName, "toggleRename", [id]],
						["Properties", cName, "details", [id]],
					];

					if (isEmpty(clipboard.getItems())) {
						list.splice(2, 1);
					}

				} else if (type == "icon") {
					const item = datasource.search(vfs.child, id);
					list = [
						["Run", ds, "execute", [id]],
						["Copy", relationship.clipboard, "addItems", ['fs', id, 'false']],
						["Cut", relationship.clipboard, "addItems", ['fs', id, 'true']],
						["Paste", cName, "paste", [id, type]],
						["Rename", cName, "toggleRename", [id]],
						["Delete", cName, "remove", [id]],
						["Properties", cName, "details", [id]],
					];


					if (item.type == "dir") {
						list[0][0] = "Open";
					}

					if (e.readonly) {
						list[2][1] = false;
						list.splice(4, 1);
					}

					if (isEmpty(clipboard.getItems()) || item.type != "dir") {
						list[3][1] = false;
						list.splice(3, 1);
					}
				}

				if (list) {
					menu.create(ev, list, id );
				}
			}

			function remove(e) {
				const id = e.dataset.id,
					datasource = components[ds];
				if (datasource.remove(id)) {
					e.parentNode.remove();
				}
			}

			function getParent(e) {
				const parent = e.parentNode,
					id = parent.dataset.id || null;
				if (!id) {
					return console.log("Id not exist on parent elem!");
				}
				return getDOM(`div.icon-text[data-id="${id}"]`);
			}

			function getDOM(selector) {
				return document.body.querySelector(selector);
			}

			function createNew(e) {
				const [id, container, type] = e.dataset.extra.split('/'),
					time = Math.round(+new Date() / 1000),
					icons = {
						dir: "folder",
						html: "file"
					},
					datasource = components[ds];

				const newItem = {
					name: "New Folder",
					id: guid(),
					description: "This is a new folder",
					icon: icons[type],
					type: type,
					readonly: false,
					onstartmenu: false,
					ondesktop: id == -1,
					createtime: time,
					lastmodify:1503812702,
				}

				if (datasource.add([newItem], id)) {
					CreateDesktopIcon(newItem, getContainer(container), true);
				}
			}

			function paste(e) {
				const [targetId, container, targetType] = e.dataset.extra.split('/'),
					time = Math.round(+new Date() / 1000),
					icons = {
						dir: "folder",
						html: "file"
					},
					datasource = components[ds],
					clipboard = components[relationship.clipboard],
					items = clipboard.getItems();
				let containerDOM,
					newWindow;
				if (!clipboard.getItems()) {
					return console.log("Clipboard is empty");
				}

				if (targetType == "free") {
					containerDOM = getContainer(container)
					if (!containerDOM) {
						return console.log("Container not exist!");
					}
					newWindow = targetId == -1 ? true : false;
				}

				for (let [sourceType, itemId, remove] of items) {
					if (sourceType == "fs") {
						remove = remove == "true";
						const item = datasource.copyItem(targetId, itemId, remove);
						if (item && targetType == "free") {
							CreateDesktopIcon(item, containerDOM, newWindow);
							if (remove) {
								const oldItem = containerDOM.querySelector(`[data-item-id="${itemId}"]`);
								if (oldItem) { oldItem.remove(); }
							}
						}
					}
				}
				clipboard.clear()
			}

			return {
				createNew(e, ev) {
					createNew(e);
				},
				createMenu(e, ev) {
					createMenu(e, ev);
				},
				createIcon(item, container, newWindow) {
					CreateDesktopIcon(item, container, newWindow);
				},
				paste(e, ev) {
					paste(e);
				},
				rename(e) {
					rename(e);
				},
				toggleRename(e) {
					toggleRename(getParent(e));
				},
				remove(e) {
					remove(getParent(e));
				},
				loadContent(list) {
					loadContent(list);
				}
			}
		},

		startMenuManager(settings, shared = false) {
			const taskbar = document.body.querySelector('footer#taskbar'),
				cName = settings.constructorName,
				ds = settings.relationship.datasource;
			let startMenu, selected = false;

			const template = {
				startMenu(itemList) {
					const [mainList, subList] = template.createList(itemList);
					return `<div class="start-menu no-select">
						<div class="start-menu-title">
							<h3> Welcome Guest! </h3>
						</div>
						<div class="sub-item-list">
							${subList}
						</div>
						<div class="main-item-list">
							<ul>${mainList}</ul>
						</div>
					</div>`;
				},
				createList(itemList) {
					let mainList = "",
						subList = "";
					for (const item of itemList) {
						mainList += template.mainList(item);
						subList += template.subList(item);
					}
					return [mainList, subList];

				},
				mainList(item) {
					return `<li data-click="${cName}.select" data-extra="${item.id}">
							<img src="./img/startmenu/${item.icon}.png" width="22" height="22"> ${item.name}
						</li>`;
				},
				subList(item) {
					return `<ul class="d-none" data-item-id="${item.id}">
						${item.child.map(item => template.subItem(item)).join("")}
					</ul>`;
				},
				subItem(item) {
					return `<li data-click="${ds}.execute" data-id="${item.id}" data-new="true" data-type="startSubIcon">
							<img src="./img/startmenu/${item.icon}.png"> ${item.name}
						</li>`;
				}
			}


			function loadContent(list) {
				taskbar.insertAdjacentHTML('afterbegin', template.startMenu(list));
				startMenu = taskbar.querySelector('.start-menu');
				select(list[0].id);
			}

			function toggleList(id) {
				const main = startMenu.querySelector(`li[data-click="${cName}.select"][data-extra="${id}"]`);
				if (main) {
					main.classList.toggle('active');
				}
				const sub = startMenu.querySelector(`ul[data-item-id="${id}"]`);
				if (sub) {
					sub.classList.toggle('d-none');
				}
			}

			function select(id) {
				if (selected) {
					toggleList(selected);
				}
				toggleList(id);
				selected = id;
			}

			return {
				select(e) {
					select(e.dataset.extra);
				},
				toggle() {
					startMenu.classList.toggle('show');
				},
				remove() {

				},
				loadContent(list) {
					loadContent(list);
				}
			}
		},

		fileSystem(settings, shared = false) {
			const {req, components, guid, objClone, assoc} = shared,
				relationship = settings.relationship;
			let vfs;

			if (localStorage.getItem('vfs')) {
				vfs = JSON.parse(localStorage.getItem('vfs'));
				init();
			} else {
				req("json", "vfs", d => {
					vfs = d;
					init();
				}, 'json' );
			}

			function init() {
				let desktopItems = [],
					startMenuItems = [],
					item;
				for (item of vfs.child) {
					if (item.ondesktop) {
						desktopItems.push(item);
					}
					if (item.onstartmenu) {
						startMenuItems.push(item);
					}
				}

				if (desktopItems.length) {
					components[relationship.desktop].loadContent(desktopItems);
				}

				if (startMenuItems.length) {
					components[relationship.startmenu].loadContent(startMenuItems);
				}
			}

			function searchInVfs(items, id) {
				let e, item;
				for (item of items) {
					if (item.id == id) {
						item.path = [];
						item.parent = [];
						return item;
					}
					if (item.child) {
						e = searchInVfs(item.child, id);
						if (e && e.id == id) {
							e.path.push(item.id);
							e.parent.push(item.name);
							return e;
						}
					}
				}
				return null;
			}

			function deleteItem(items, id) {
				let i, max = items.length;
				for (i = 0; i < max; i++) {
					if (items[i].id == id) {
						items.splice(i, 1);
						save();
						return true;
					}
					if (items[i].child) {
						if (deleteItem(items[i].child, id) === true) {
							return true;
						};
					}
				}
				return null;
			}

			function add(items, to) {
				let target = to == -1 ? vfs : searchInVfs(vfs.child, id);
				if (!target) {
					return false;
				}
				if (!target.child) {
					target.child = [];
				}
				target.child.push(...items);
				save();
				return true;
			}

			function save() {
				localStorage.setItem('vfs', JSON.stringify(vfs))
				return true;
			}

			function prepareItems(items, remove) {
				let i, max = items.length;
				for (i = 0; i < max; i++) {
					items[i].id = guid();
					if (!remove) {
						items[i].name = items[i].name + " copy";
					}
					if (items[i].child) {
						prepareItems(items[i].child, remove);
					}
				}
				return null;
			}

			function prepareItem(item, remove) {
				if (Array.isArray(item)) {
					return prepareItems(item, remove);
				}

				item.id = guid();
				if (!remove) {
					item.name = item.name + " copy";
				}

				if (item.child && item.child.length > 0) {
					return prepareItems(item.child, remove);
				}
				return;
			}

			function copyItem(targetId, sourceId, removeItem = false) {
				const s = searchInVfs(vfs.child, sourceId);
				if (!s) { return null; }
				const itemCopy = objClone(s);
				prepareItem(itemCopy, removeItem);
				if (!add([itemCopy], targetId)) {
					return false;
				};
				if (removeItem) {
					deleteItem(vfs.child, sourceId);
				}
				return itemCopy;
			}


			function execute(e, ev) {
				const id = e.dataset.id;
				if (!id) {
					return console.log("This file not have id!");
				}
				const item = searchInVfs(vfs.child, id),
					app = components[assoc[item.type] || "-"] || false;

				console.log('open with: '+ assoc[item.type], app);

				if (!item) {
					return console.log("File corrupt or not exist anymore!");
				} else if (!app || !app.open) {
					return console.log("Not exist associated application!");
				}
				app.open(e, ev);
			}

			return {
				add(items, to) {
					return add(items, to);
				},
				copyItem(targetId, sourceId, removeItem = false) {
					return copyItem(targetId, sourceId, removeItem);
				},
				execute(e, ev) {
					execute(e, ev);
				},
				get(id) {
					return searchInVfs(vfs.child, id);
				},
				search(items, id) {
					return searchInVfs(items, id);
				},
				remove(id) {
					return deleteItem(vfs.child, id)
				},
				save() {
					return save();// save into localstorage
				},
				getDatabase() {
					return vfs;
				}
			}
		},
		fileExplorer(settings, shared = false) {

			const { components } = shared,
				{ datasource: ds, window, desktop: icon } = settings.relationship;

			const template = {
				navLink(label, path) {
					const len = label.length;
					let i = 0, str = "";
					if (len == 0) {
						return str;
					}
					for (;i < len; i++) {
						str += `<li ${template.createData(path[i])}">${label[i]}</li>`;
					}
					return str;
				},
				createData(cont, itemId) {
					return `data-id="${itemId}" data-container="${cont}" data-new="false"`;
				},
				addressbar(item, options) {
					const {cont, itemId, newWin} = options,
						navLinks = template.navLink(item.parent, item.path)
						homeLink = template.createData(cont, item.path[0] || itemId, newWin);
						upLink = template.createData(cont, item.path[0] || itemId, newWin);

					return `<div class="addressbar">
								<span class="home" ${homeLink}>
									<img src="./img/app/home.png">
								</span>
								<span class="up" ${upLink}>
									<img src="./img/app/up.png">
								</span>
								<nav>
									<ul>${navLinks}</ul>
								</nav>
							</div>`;
				}
			}

			let windows = [];

			function createNewWindow(item, d) {
				const options = {
					data: d,
					appClass: settings.windowClass,
					title: settings.name,
					subTitle: "- "+item.name,
					source: settings.constructorName,
					theme: 'window-light-blue',
					afterHeader: template.addressbar(
						item, {
							cont: d.container,
							itemId: d.id,
							newWin: d.new
						}
					),
				};

				return components[window].register(options);


			}

			function updateContent(item, d, win) {
				const items = item.child || [],
					desktop = components[icon];
				for(const itm of items) {
					desktop.createIcon(itm, win.body, false);
				}
			}

			function open(e, ev) {

				const d = e.dataset,
					newWin = (d.new || false) === "true";
				let win;
				if (!d.container || !d.id) {
					return console.log('Cannot execute, insufficient information!');
				}
				const item = components[ds].get(d.id);
				if (!item) {
					return console.log('File or folder not exist!');
				}

				if (windows.length >= settings.maxProc && d.new) {
					return console.log('Too much opened window, cannot open more!');
				}

				if (newWin) {
					win = createNewWindow(item, d);

					if (!win) {
						return console.log("Failed to create new file explorer window!");
					}
					win.up = win.dom.querySelector('.up');
					win.home = win.dom.querySelector('.home');
					win.nav = win.dom.querySelector('.addressbar nav ul');
					windows.push(win);
				} else if (d.container != "-1") {
					win = components[window].getWindow(d.container);
					console.log(win);
					if (!win) {
						return console.log("File Explorer window not exist!");
					}
					win.body.innerHTML = "";
				}

				updateContent(item, d, win);
			}

			function close(win) {
				const len = windows.length;
				let i = 0;
				for (; i < len; i++) {
					if (windows[i].id == win.id) {
						return windows.splice(i, 1);
					}
				}
			}

			return {
				close(win) {
					close(win);
				},
				open(e, ev) {
					open(e, ev);
				},
				remove() {

				}
			}
		},

		windowManager(settings, shared = false) {
			const { guid, components } = shared,
				cName = settings.constructorName,
			 	template = {
					window(settings) {
						const {
							id,
							appClass = "",
							title = "",
							subTitle = "",
							theme = "",
							afterHeader = "",
							afterContent = "",
							content = ""
						} = settings;
						return `<div class="container">
									<div class="header no-select">
										<h4 data-after-text="${subTitle}">
											${title}
										</h4>
										<div class="minimize" data-click="${cName}.minimize" data-id="${id}">_</div>
										<div class="close" data-click="${cName}.close" data-id="${id}">✖</div>
									</div>
									${afterHeader}
									<div class="content" data-id="${id}">${content}</div>
									${afterContent}
								</div>`;
					}
			};

			let windows = {};

			function getNewId() {
				let newId = guid();
				console.log(!windows['win_'+newId]);
				if (!windows['win_'+newId]) {
					return newId;
				}
				return getNewId();
			};

			function setRandomPosition(dom = false, options = {}) {
				const body = document.body,
					{
						minW = 200,
						minH = 150,
						maxW = 800,
						maxH = 400
					} = options,
					maxX = Math.min(body.offsetWidth, maxW),
					maxY = Math.min(body.offsetHeight, maxH),
					width = Math.random() * (maxX - minW) + minW,
					height = Math.random() * (maxY - minH) + minH,
					x = Math.random() * (maxX - width),
					y = Math.random() * (maxY - height);
				dom.style.top = Math.floor(y) + 'px';
				dom.style.left = Math.floor(x) + 'px';
			}

			function create(options) {
				const id = getNewId(),
					dom = document.createElement("div");
				options.id = id;
				options.status = true;
				dom.innerHTML = template.window(options);
				dom.id = "win_" + options.id;
				dom.classList.add('window', options.appClass, options.theme);
				const cont = dom.querySelector(settings.contentSelector);
				options.dom = dom;
				options.body = cont;
				windows[id] = options;
				document.body.append(dom);
				setRandomPosition(dom);
				return options;
			}

			function register(options) {
				return create(options);
			}

			function minimize(e) {
				const id = e.dataset.id,
					win = windows[id];
				if (!win) { return console.log('Window not found'); }
				win.status = !win.status;
				win.dom.classList.toggle('d-none');
			}

			function close(e) {
				const id = e.dataset.id,
					win = windows[id];
				if (!win) { return console.log('Window not found'); }
				components[win.source].close(win);
				win.dom.remove();
				delete windows[id];
			}

			return {
				close(e, ev) {
					close(e);
				},
				minimize(e, ev) {
					minimize(e);
				},
				getWindow(id) {
					return windows[id] || null;
				},
				register(options) {
					return create(options);
				},
				remove() {

				}
			}
		}
	},
}

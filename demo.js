var demo = {
	LAZY_MIN: 1000,
	LAZY_MAX: 1000,
	CLEAR_COLOR: '#39609B',
	RES_PATH: 'res',
	RackId_arr:[],
	ServersId_arr:[],
	ServersIndexId_arr:[],
	Fake_arr:[],

	lastElement: null,
	timer: null,

	getRes: function(file) {
		return demo.RES_PATH + '/' + file;
	},

	getEnvMap: function() {
		if (!demo.defaultEnvmap) {
			demo.defaultEnvmap = [];
			var image = demo.getRes('room.jpg');
			for (var i = 0; i < 6; i++) {
				demo.defaultEnvmap.push(image);
			}
		}
		return demo.defaultEnvmap;
	},

	//all registered object creaters.
	_creators: {},

	//all registered object filters.
	_filters: {},

	//all registered shadow painters.
	_shadowPainters: {},

	registerCreator: function(type, creator) {
		this._creators[type] = creator;
	},

	getCreator: function(type) {
		return this._creators[type];
	},

	registerFilter: function(type, filter) {
		this._filters[type] = filter;
	},

	getFilter: function(type) {
		return this._filters[type];
	},

	registerShadowPainter: function(type, painter) {
		this._shadowPainters[type] = painter;
	},

	getShadowPainter: function(type) {
		return this._shadowPainters[type];
	},

	initOverview: function(network) {
		var overView = new mono.Overview3D(network);
	},

	init: function(htmlElementId) {
		// Network3D是一个用于交互的视图组件，可以展示3D场景，
		// 并实现用户和3D场景之间的交互，比如旋转镜头，选中3D对象，通过鼠标或键盘移动3D对象等		
		// mono.Network3D ( dataBox  camera  canvas  parameters )
		var network = window.network = new mono.Network3D();
		// 速查器通过构造函数来绑定数据容器和需要进行索引的属性，一旦绑定之后，
		// 当数据容器中索引的属性值发生变化时，速查器中数据也会进行相应的修改
		demo.typeFinder = new mono.QuickFinder(network.getDataBox(), 'type', 'client');
		demo.labelFinder = new mono.QuickFinder(network.getDataBox(), 'label', 'client');
		// 透视镜头对象,视场角、近切面、远切面等是透视镜头的重要概念
		// 在nomo中，3D中的物体只有出现在fov、near、far组成的四棱锥空间内，才可能被镜头看到，否则看不见
		// mono.PerspectiveCamera ( 视场角，默认为50度,  横纵比;是镜头水平方向和竖直方向长度的比值，通常设为canvas的横纵比例，默认值为1;
		//   near  far ) 
		var camera = new mono.PerspectiveCamera(30, 1.5, 30, 50000);
		network.setCamera(camera);
		// 默认的交互模式，mono中提供的默认交互模式包括可以在3D场景中旋转镜头，通过鼠标滚轮缩放镜头，键盘操作镜头等。
		var interaction = new mono.DefaultInteraction(network);
		interaction.yLowerLimitAngle = Math.PI / 180 * 2;
		interaction.yUpLimitAngle = Math.PI / 2;
		interaction.maxDistance = 20000;
		interaction.minDistance = 50;
		interaction.zoomSpeed = 3;
		interaction.panSpeed = 0.2;
		// 编辑交互模式，在此模式下可以编辑3D对象，例如平移，缩放，旋转等
		var editInteraction = new mono.EditInteraction(network);
		editInteraction.setShowHelpers(true);
		editInteraction.setScaleable(false);
		editInteraction.setRotateable(false);
		editInteraction.setTranslateable(true);
		network.setInteractions([interaction, new mono.SelectionInteraction(network), editInteraction]);
		network.isSelectable = function(element) {
			return network.moveView && element.getClient('type') === 'rack';
		};
		network.editableFunction = function(element) {
			return network.moveView && element.getClient('type') === 'rack';
		}

		document.getElementById(htmlElementId).appendChild(network.getRootView());
		var tooltip = new Tooltip(['BusinessId'], ['000000']);
		document.body.appendChild(tooltip.getView());
		var personLoaded = false;
		var time;
		var buttons = [{
			label: '场景复位',
			icon: 'reset.png',
			class: 'reset',
			clickFunction: function() {
				clearInterval(time);
				demo.resetView(network);
				$('#color-tape').css('display',"none");
				$('#serch_posi').css('display',"block");
				var img = document.getElementById('toolbar').childNodes;
				for (var i = 0; i < img.length; i++) {
					img[0].setAttribute('class', 'reset');
					img[1].setAttribute('class', 'temp');
					img[2].setAttribute('class', 'allTemp')
				}
				this.setAttribute('class', 'allTemp active');
				demo.showRackHideAtemp();
			}
		}, {
			label: '温度图',
			icon: 'temperature.png',
			class: 'temp',
			clickFunction: function() {
				clearInterval(time);
				demo.resetView(network);
				$('#color-tape,#serch_posi').css('display',"none");
				$("#serch_close").trigger('click');
				var img = document.getElementById('toolbar').childNodes;
				for (var i = 0; i < img.length; i++) {
					img[0].setAttribute('class', 'reset');
					img[1].setAttribute('class', 'temp');
					img[2].setAttribute('class', 'allTemp')
				}
				this.setAttribute('class', 'temp active');
				demo.showRackHideAtemp();
			}
		}, {
			label: '温度图全景',
			icon: 'edit.png',
			class: 'allTemp',
			clickFunction: function() {
				$('#color-tape').css('display',"block");
				$('#serch_posi').css('display',"none");
				$("#serch_close").trigger('click');
				var img = document.getElementById('toolbar').childNodes;
				for (var i = 0; i < img.length; i++) {
					img[0].setAttribute('class', 'reset');
					img[1].setAttribute('class', 'temp');
					img[2].setAttribute('class', 'allTemp')
				}
				this.setAttribute('class', 'allTemp active');			
				// var showing=network.temperatureView;
				demo.resetView(network);
				// if(!showing){

					demo.showRackHideAtemp();
					demo.toggleTemperatureView(network);

					time=setInterval(function(){
						demo.showRackHideAtemp();
						demo.toggleTemperatureView(network);
			        }, 120000);

			}
		},{
			label: '机柜利用率',
			icon: 'usage.png',
			clickFunction: function(){
				clearInterval(time);
				$('#color-tape').css('display',"none");
				$('#serch_posi').css('display',"none");
				$("#serch_close").trigger('click');
				var showing=network.usageView;
				demo.resetView(network);
				if(!showing){
					demo.showRackHideAtemp();
					demo.toggleUsageView(network);
				}
			}
		}];

		demo.setupToolbar(buttons);

		this.setupControlBar(network);

		mono.Utils.autoAdjustNetworkBounds(network, document.documentElement, 'clientWidth', 'clientHeight');
		network.getRootView().addEventListener('dblclick', function(e) {
			demo.handleDoubleClick(e, network);
		});
		network.getRootView().addEventListener('mousemove', function(e) {
			demo.handleMouseMove(e, network, tooltip);
		});

		demo.setupLights(network.getDataBox());
		network.getDataBox().getAlarmBox().addDataBoxChangeListener(function(e) {
			var alarm = e.data;
			if (e.kind === 'add') {
				var node = network.getDataBox().getDataById(alarm.getElementId());
				node.setStyle('m.alarmColor', null);
			}
		});

		network.getDataBox().addDataPropertyChangeListener(function(e) {
			var element = e.source,
				property = e.property,
				oldValue = e.oldValue,
				newValue = e.newValue;
			if (property == 'position' && network.moveView) {
				if (oldValue.y != newValue.y) {
					element.setPositionY(oldValue.y);
				}
			}

		});

		network.addInteractionListener(function(e) {
			if (e.kind == 'liveMoveEnd') {
				demo.dirtyShadowMap(network);
			}
		});
		// chenjun
		demo.loadRacks();
		// chenjun
		var time1 = new Date().getTime();
		demo.loadData(network);
		var time2 = new Date().getTime();
		console.log('time:  ' + (time2 - time1));

		// demo.startSmokeAnimation(network);
		// demo.startFpsAnimation(network);
		demo.resetCamera(network);

		this.initOverview(network);
	},
	//---------------初始化场景视角
	// 温度全景刷新时销毁创建的对象
	showRackHideAtemp:function(){
		network.getDataBox().forEach(function(element) {
			var type = element.getClient('type');
			if (type === 'rack' || type === 'rack.door') {
				element.setVisible(true);
			}	
		});
		// console.log(demo.Fake_arr.length)
		if(demo.Fake_arr.length>0){
			for(var i=0;i<demo.Fake_arr.length;i++){
				var obj=network.getDataBox().getDataById(demo.Fake_arr[i]);
				network.getDataBox().remove(obj);
				// 删除创建的obj
			}
			demo.Fake_arr=[];
		}
		// console.log(demo.Fake_arr.length)
	},

	resetCamera: function(network) {
		network.getCamera().setPosition(0, 1500, 1700);
		network.getCamera().lookAt(new mono.Vec3(0, 0, 0));
	},

	dirtyShadowMap: function(network) {
		var floor = network.getDataBox().shadowHost;
		var floorCombo = demo.typeFinder.findFirst('floorCombo');
		demo.updateShadowMap(floorCombo, floor, floor.getId(), network.getDataBox());
	},

	removeObj: function(box) {
		var person = demo.typeFinder.find('person').get(0);
		person.animate.stop();
		box.removeByDescendant(person);

		var trail = demo.typeFinder.find('trail').get(0);
		box.removeByDescendant(trail);
	},

	_playRackDoorAnimate: function(label) {
		var element = demo.labelFinder.findFirst(label);
		var rackDoor = element.getChildren().get(0);
		if (rackDoor.getClient('animation')) {
			demo.playAnimation(rackDoor, rackDoor.getClient('animation'));
		}
	},

	loadObj: function(camera, box) {
		var obj = demo.getRes('worker.obj');
		var mtl = demo.getRes('worker.mtl');

		var loader = new mono.OBJMTLLoader();
		loader.load(obj, mtl, {
			'worker': demo.getRes('worker.png'),
		}, function(object) {
			object.setScale(3, 3, 3);
			object.setClient('type', 'person');
			box.addByDescendant(object);

			var updater = function(element) {
				if (element && element.getChildren()) {
					element.getChildren().forEach(function(child) {
						child.setStyle('m.normalType', mono.NormalTypeSmooth);
						updater(child);
					});
				}
			}
			updater(object);

			var x = -650,
				z = 600,
				angle = 0;
			object.setPosition(x, 0, z);
			object.setRotationY(angle);
			//var points=[[650, 600], [650, -300], [130, -300], [130, -600], [-650, -600], [-650, 580], [-450, 580], [-400, 550]];
			var points = [
				[-350, 600],
				[-350, 400],
				[450, 400],
				[450, 100],
				[-200, 100],
				[-200, -100],
				[-370, -100],
				[-370, -150]
			];

			var cameraFollow = new CameraFollow(camera);

			cameraFollow.setHost(object);

			var leftDoor = demo.typeFinder.findFirst('left-door');
			var rightDoor = demo.typeFinder.findFirst('right-door');
			demo.playAnimation(leftDoor, leftDoor.getClient('animation'));
			demo.playAnimation(rightDoor, rightDoor.getClient('animation'), function() {
				object.animate = demo.createPathAnimates(camera, object, points, false, null, function() {
					demo._playRackDoorAnimate('1A03')
				});
				object.animate.play();
			});

			var path = new mono.Path();
			path.moveTo(object.getPositionX(), object.getPositionZ());
			for (var i = 0; i < points.length; i++) {
				path.lineTo(points[i][0], points[i][1]);
			}
			path = mono.PathNode.prototype.adjustPath(path, 5);

			var trail = new mono.PathCube(path, 3, 1);
			trail.s({
				'm.type': 'phong',
				'm.specularStrength': 30,
				'm.color': '#298A08',
				'm.ambient': '#298A08',
				'm.texture.image': demo.getRes('flow.jpg'),
				'm.texture.repeat': new mono.Vec2(150, 1),
			});
			trail.setRotationX(Math.PI);
			trail.setPositionY(5);
			trail.setClient('type', 'trail');
			box.add(trail);
		});
	},

	createPathAnimates: function(camera, element, points, loop, finalAngle, done) {
		var animates = [];

		if (points && points.length > 0) {
			var x = element.getPositionX();
			var z = element.getPositionZ();
			var angle = element.getRotationY();

			var createRotateAnimate = function(camera, element, toAngle, angle) {
				if (toAngle != angle && toAngle != NaN) {
					if (toAngle - angle > Math.PI) {
						toAngle -= Math.PI * 2;
					}
					if (toAngle - angle < -Math.PI) {
						toAngle += Math.PI * 2;
					}
					//console.log(angle, toAngle);
					var rotateAnimate = new twaver.Animate({
						from: angle,
						to: toAngle,
						type: 'number',
						dur: Math.abs(toAngle - angle) * 300,
						easing: 'easeNone',
						onPlay: function() {
							element.animate = this;
						},
						onUpdate: function(value) {
							element.setRotationY(value);
						},

					});
					rotateAnimate.toAngle = toAngle;
					return rotateAnimate;
				}
			}

			for (var i = 0; i < points.length; i++) {
				var point = points[i];
				var x1 = point[0];
				var z1 = point[1];
				var rotate = Math.atan2(-(z1 - z), x1 - x);

				var rotateAnimate = createRotateAnimate(camera, element, rotate, angle);
				if (rotateAnimate) {
					animates.push(rotateAnimate);
					angle = rotateAnimate.toAngle;
				}

				var moveAnimate = new twaver.Animate({
					from: {
						x: x,
						y: z
					},
					to: {
						x: x1,
						y: z1
					},
					type: 'point',
					dur: Math.sqrt((x1 - x) * (x1 - x) + (z1 - z) * (z1 - z)) * 5,
					easing: 'easeNone',
					onPlay: function() {
						element.animate = this;
					},
					onUpdate: function(value) {
						element.setPositionX(value.x);
						element.setPositionZ(value.y);
					},
				});
				animates.push(moveAnimate);

				x = x1;
				z = z1;
			}

			if (finalAngle != undefined && angle != finalAngle) {
				var rotateAnimate = createRotateAnimate(camera, element, finalAngle, angle);
				if (rotateAnimate) {
					animates.push(rotateAnimate);
				}
			}
		}
		animates[animates.length - 1].onDone = done;
		var animate;
		for (var i = 0; i < animates.length; i++) {
			if (i > 0) {
				animates[i - 1].chain(animates[i]);
				if (loop && i == animates.length - 1) {
					animates[i].chain(animate);
				}
			} else {
				animate = animates[i];
			}
		}
		return animate;
	},

	toggleConnectionView: function(network) {
		network.connectionView = !network.connectionView;

		var connectionView = network.connectionView;
		var box = network.getDataBox();
		var connections = demo.typeFinder.find('connection');
		var rails = demo.typeFinder.find('rail');
		connections.forEach(function(connection) {
			connection.setVisible(connectionView);
			if (!connection.billboard) {
				connection.billboard = new mono.Billboard();
				connection.billboard.s({
					'm.texture.image': demo.createConnectionBillboardImage('0'),
					'm.vertical': true,
				});
				connection.billboard.setScale(60, 30, 1);
				connection.billboard.setPosition(400, 230, 330);
				box.add(connection.billboard);
			}
			connection.billboard.setVisible(connectionView);
			if (connection.isVisible()) {
				var offsetAnimate = new twaver.Animate({
					from: 0,
					to: 1,
					type: 'number',
					dur: 1000,
					repeat: Number.POSITIVE_INFINITY,
					reverse: false,
					onUpdate: function(value) {
						connection.s({
							'm.texture.offset': new mono.Vec2(value, 0),
						});
						if (value === 1) {
							var text = '54' + parseInt(Math.random() * 10) + '.' + parseInt(Math.random() * 100);
							connection.billboard.s({
								'm.texture.image': demo.createConnectionBillboardImage(text),
							});
						}
					},
				});
				offsetAnimate.play();
				connection.offsetAnimate = offsetAnimate;
			} else {
				if (connection.offsetAnimate) {
					connection.offsetAnimate.stop();
				}
			}
		});
		rails.forEach(function(rail) {
			rail.setVisible(connectionView);
		});
	},
	//---------------场景光线设置
	setupLights: function(box) {
		var pointLight = new mono.PointLight(0xFFFFFF, 0.3);
		pointLight.setPosition(0, 1000, -1000);
		box.add(pointLight);

		var pointLight = new mono.AmbientLight(0xFFFFFF, 0.3);
		pointLight.setPosition(-500, 1000, 1000);
		box.add(pointLight);

		//var pointLight = new mono.SpotLight(0xFFFFFF, 1);
		//pointLight.setPosition(0, 500, 500);
		//box.add(pointLight);

		var pointLight = new mono.PointLight(0xFFFFFF, 0.3);
		pointLight.setPosition(0, 1000, 1000);
		box.add(pointLight);

		var pointLight = new mono.PointLight(0xFFFFFF, 0.3);
		pointLight.setPosition(1000, -1000, 1000);
		box.add(pointLight);;

		box.add(new mono.AmbientLight('white'));
	},

	handleDoubleClick: function(e, network) {
		var camera = network.getCamera();
		var interaction = network.getDefaultInteraction();
		var firstClickObject = demo.findFirstObjectByMouse(network, e);
		if (firstClickObject) {
			var element = firstClickObject.element;
			var newTarget = firstClickObject.point;
			var oldTarget = camera.getTarget();
			if (element.getClient('animation')) {
				demo.playAnimation(element, element.getClient('animation'));
			} else if (element.getClient('dbl.func')) {
				var func = element.getClient('dbl.func');
				func();
			} else {
				demo.animateCamera(camera, interaction, oldTarget, newTarget);
			}
		} else {
			var oldTarget = camera.getTarget();
			var newTarget = new mono.Vec3(0, 0, 0);
			demo.animateCamera(camera, interaction, oldTarget, newTarget);
		}
	},

	//鼠标移动到网元上1S后显示tooltip
	handleMouseMove: function(e, network, tooltipObj) {
		var objects = network.getElementsByMouseEvent(e);
		//获取当前网元，如果当前鼠标下有对象并且类型为group，那么就设置currentElement为鼠标下的网元
		var currentElement = null;
		var tooltip = tooltipObj.getView();
		// var tooltip = document.getElementById('tooltip');
		if (objects.length) {
			var first = objects[0];
			var object3d = first.element;
			if (object3d.getClient('type') === 'card' && object3d.getClient('isAlarm')) {
				currentElement = object3d;
				tooltipObj.setValues([object3d.getClient('BID')]);
			}
		}
		//如果当前和上一次的网元不一致，先清除timer。
		//如果当前网元有值，起一个timer，2S后显示tooltip。
		//tooltip显示的位置为最近一次鼠标移动时的位置
		if (demo.lastElement != currentElement) {
			clearTimeout(demo.timer);
			if (currentElement) {
				demo.timer = setTimeout(function() {
					tooltip.style.display = 'block';
					tooltip.style.position = 'absolute';
					tooltip.style.left = (window.lastEvent.pageX - tooltip.clientWidth / 2) + 'px';
					tooltip.style.top = (window.lastEvent.pageY - tooltip.clientHeight - 15) + 'px';
				}, 1000);
			}
		}
		//设置上一次的网元为当前网元
		demo.lastElement = currentElement;
		//如果当前鼠标下没有网元，隐藏tooltip
		if (currentElement == null) {
			tooltip.style.display = 'none';
		}
		//设置每次移动时鼠标的事件对象
		window.lastEvent = e;
	},

	copyProperties: function(from, to, ignores) {
		if (from && to) {
			for (var name in from) {
				if (ignores && ignores.indexOf(name) >= 0) {
					//ignore.
				} else {
					to[name] = from[name];
				}
			}
		}
	},

	createCubeObject: function(json) {
		var translate = json.translate || [0, 0, 0];
		var width = json.width;
		var height = json.height;
		var depth = json.depth;
		var sideColor = json.sideColor;
		var topColor = json.topColor;

		var object3d = new mono.Cube(width, height, depth);
		object3d.setPosition(translate[0], translate[1] + height / 2, translate[2]);
		object3d.s({
			'm.color': sideColor,
			'm.ambient': sideColor,
			'left.m.lightmap.image': demo.getRes('inside_lightmap.jpg'),
			'right.m.lightmap.image': demo.getRes('outside_lightmap.jpg'),
			'front.m.lightmap.image': demo.getRes('outside_lightmap.jpg'),
			'back.m.lightmap.image': demo.getRes('inside_lightmap.jpg'),
			'top.m.color': topColor,
			'top.m.ambient': topColor,
			'bottom.m.color': topColor,
			'bottom.m.ambient': topColor,
		});
		object3d.setClient('type', 'rack');
		return object3d;
	},

	create2DPath: function(pathData) {
		var path;
		for (var j = 0; j < pathData.length; j++) {
			var point = pathData[j];
			if (path) {
				path.lineTo(point[0], point[1], 0);
			} else {
				path = new mono.Path();
				path.moveTo(point[0], point[1], 0);
			}
		}

		return path;
	},

	create3DPath: function(pathData) {
		var path;
		for (var j = 0; j < pathData.length; j++) {
			var point = pathData[j];
			if (path) {
				path.lineTo(point[0], point[1], point[2]);
			} else {
				path = new mono.Path();
				path.moveTo(point[0], point[1], point[2]);
			}
		}

		return path;
	},

	createPathObject: function(json) {
		var translate = json.translate || [0, 0, 0];
		var pathWidth = json.width;
		var pathHeight = json.height;
		var pathData = json.data;
		var path = this.create2DPath(pathData);
		var pathInsideColor = json.insideColor;
		var pathOutsideColor = json.outsideColor;
		var pathTopColor = json.topColor;

		var object3d = this.createWall(path, pathWidth, pathHeight, pathInsideColor, pathOutsideColor, pathTopColor);
		object3d.setPosition(translate[0], translate[1], -translate[2]);
		object3d.shadow = json.shadow;

		return object3d;
	},

	filterJson: function(box, objects) {
		var newObjects = [];

		for (var i = 0; i < objects.length; i++) {
			var object = objects[i];
			var type = object.type;
			var filter = this.getFilter(type);
			if (filter) {
				var filteredObject = filter(box, object);
				if (filteredObject) {
					if (filteredObject instanceof Array) {
						newObjects = newObjects.concat(filteredObject);
					} else {
						this.copyProperties(object, filteredObject, ['type']);
						newObjects.push(filteredObject);
					}
				}
			} else {
				newObjects.push(object);
			}
		}

		return newObjects;
	},

	createCombo: function(parts) {
		var children = [];
		var ops = [];
		var ids = [];
		for (var i = 0; i < parts.length; i++) {
			var object = parts[i];
			var op = object.op || '+';
			var style = object.style;
			var translate = object.translate || [0, 0, 0];
			var rotate = object.rotate || [0, 0, 0];
			var object3d = null;
			if (object.type === 'path') {
				object3d = this.createPathObject(object);
			}
			if (object.type === 'cube') {
				object3d = this.createCubeObject(object);
			}
			if (object3d) {
				object3d.setRotation(rotate[0], rotate[1], rotate[2]);
				if (style) {
					object3d.s(style);
				}
				children.push(object3d);
				if (children.length > 1) {
					ops.push(op);
				}
				ids.push(object3d.getId());
			}
		}

		if (children.length > 0) {
			var combo = new mono.ComboNode(children, ops);
			combo.setNames(ids);
			return combo;
		}
		return null;
	},

	loadData: function(network) {
		var json = demo.filterJson(network.getDataBox(), dataJson.objects);
		var box = network.getDataBox();

		network.setClearColor(demo.CLEAR_COLOR);

		var children = [];
		var ops = [];
		var ids = [];
		var shadowHost;
		var shadowHostId;
		for (var i = 0; i < json.length; i++) {
			var object = json[i];
			var op = object.op;
			var style = object.style;
			var client = object.client;
			var translate = object.translate || [0, 0, 0];
			var rotate = object.rotate || [0, 0, 0];
			var object3d = null;

			if (object.type === 'path') {
				object3d = this.createPathObject(object);
			}
			if (object.type === 'cube') {
				object3d = this.createCubeObject(object);
			}

			if (object.shadowHost) {
				shadowHost = object3d;
				shadowHostId = object3d.getId();
				box.shadowHost = shadowHost;
			}

			var creator = demo.getCreator(object.type);
			if (creator) {
				creator(box, object);
				continue;
			}

			if (object3d) {
				object3d.shadow = object.shadow;
				object3d.setRotation(rotate[0], rotate[1], rotate[2]);
				if (style) {
					object3d.s(style);
				}
				if (client) {
					for (var key in client) {
						object3d.setClient(key, client[key]);
					}
				}
				if (op) {
					children.push(object3d);
					if (children.length > 1) {
						ops.push(op);
					}
					ids.push(object3d.getId());
				} else {
					box.add(object3d);
				}
			}
		}

		if (children.length > 0) {
			var combo = new mono.ComboNode(children, ops);
			combo.setNames(ids);
			combo.setClient('type', 'floorCombo');
			box.add(combo);

			//lazy load floor shadow map.
			if (shadowHost && shadowHostId) {
				setTimeout(function() {
					demo.updateShadowMap(combo, shadowHost, shadowHostId, box)
				}, demo.LAZY_MAX);
			}
		}

		//调用showCardTable方法
		demo.showCardTable();

		demo.rack_monitor_overview();
		// chenjun
		demo.serchObj(box,network,json);
		// chenjun end
	},

	// chenjun
	loadRacks: function(){
		if (window.XMLHttpRequest) {
			XHR = new XMLHttpRequest();
		} else if (window.ActiveXObject) {
			XHR = new ActiveXObject("Microsoft.XMLHTTP");
		} else {
			XHR = null;
		}
		if(XHR){
			var url='rack/racks.json';
			XHR.open("GET", url,false);
			XHR.onreadystatechange = function () {
				if (XHR.readyState == 4 && XHR.status == 200) {
					var data=eval("("+XHR.responseText+")");
					dataJson.objects[dataJson.objects.length] = data;
					XHR = null;
				}
			};
			XHR.send();
		}
	},

	serchObj: function(box,network,json){
		var div = document.getElementById('serch_posi');
		div.style.display = 'block';
		if(div){
			div.onclick = function(){

				var divbox = document.getElementById('serch_box');//----------模态框主体。
				var text = document.getElementById('serch_text');//----------输入框主体
				var text_none = document.getElementById('serch_text_none');//----------输入框主体
				var close = document.getElementById('serch_close');//----------关闭按钮
				var result = document.getElementById('serch_con');//----------查询结果主体
				var color = 'red';
				var key,arr_con=[];
				if(divbox){
					divbox.style.display = 'block';
				}
				//---------关闭按钮，并清空查询数据
				if(close){
					close.onclick = function(){
						$("#serch_box").css({"display":"none"})
						text.value = "";
						result.innerText = "";
						resetRackTop();
					}
				}
				text.onfocus = function(){
					key = true;
					document.onkeydown=function(event){
						var e = event || window.event || arguments.callee.caller.arguments[0];
						var br = "<br />";
						if(key && e && e.keyCode==13){
							resetRackTop();
							if(!text.value){
								result.innerHTML = "<h1 style='text-align: center;color: red'>请输入正确的机器名称</h1>";
							}else {
								result.innerHTML = "";
								var json_fa = json[json.length-1];
								for(var name in json_fa.servers){
									result.innerHTML += queryJson(box,json_fa.servers[name],name);
								}
								for(var name in json_fa.chassises){
									var chassis_card = json_fa.chassises[name];
									for(var i=0;i<chassis_card.length;i++){
										var chassis_ser = chassis_card[i].cards;
										result.innerHTML += queryJson(box,chassis_ser,name,chassis_card[i].id);
									}
								};

								if(result.innerHTML == ""){
									result.innerHTML = "<h1 style='text-align: center;color: red'>无匹配结果！<br />请输入正确的机器名称。</h1>";
								}
							}
						}
					};
				}
				text.onblur = function(){
					key = false;
				}
				function queryJson(box,json_sun,name,chassisid){
					var chassisid = chassisid || null;
					var step = "";
					var br = "<br />";
					var arr = ["名称:"," 机架:"," 刀箱:"," 位置:"];
					text_none.value = text.value;
					if(text.value == "all"){
						text_none.value = ".";
					}else {
						if(text.value == "^" || "$" || "(" ||")" || "()" || "*"){
							return step;
						}
					}
					for (var i=0;i<json_sun.length;i++) {
						//if(eval("/\w*[-]*" + text.value + "[-]*\w*/").test(json_sun[i].hostname)){
						if(eval("/^(.*" + text_none.value + ".*)$/").test(json_sun[i].hostname)){
							modifySerchRack(box,json_sun[i],name,chassisid);
							demo.ServersId_arr.push(json_sun[i].id);
							if(chassisid){
								step += arr[0] + json_sun[i].hostname + arr[1] + name + arr[2] + chassisid + arr[3] +  json_sun[i].position + br;
							}else {
								step += arr[0] + json_sun[i].hostname + arr[1] + name + arr[3] +  json_sun[i].position + br;
							}
						}
					}
					return step;
				}
				//----------对比查找并改变机架颜色
				function modifySerchRack(box,obj,name,chassisid){
					var json = dataJson.objects[dataJson.objects.length-1];
					for(var i=0;i<json.labels.length;i++){
						//console.log(json.ids[i]);
						if(json.labels[i] == name){
							var rackid = demo.RackId_arr[i];
							var rack = box.getDataById(rackid);
							rack.s({
								'top.m.texture.color': color,
								'top.m.ambient': color,
							})
						}


					}

				}
				//---------重置机架顶部颜色
				function resetRackTop(){
					demo.resetView(network);
					if(demo.RackId_arr.length>0){
						for(var i=0;i<demo.RackId_arr.length;i++){
							var rackId = demo.RackId_arr[i];
							var rack = box.getDataById(rackId);
							rack.s({
								'top.m.texture.color': '#557E7A',
								'top.m.ambient': '#557E7A',
							})
						}
					}
					demo.ServersId_arr.length = 0;
					demo.ServersIndexId_arr.length = 0;
				}
			}
		}
	},
	// chenjun end
	updateShadowMap: function(combo, shadowHost, shadowHostId, box) {
		var shadowMapImage = demo.createShadowImage(box, shadowHost.getWidth(), shadowHost.getDepth());
		var floorTopFaceId = shadowHostId + '-top.m.lightmap.image';
		combo.setStyle(floorTopFaceId, shadowMapImage);
	},
	// demo.loadRackContent(box, x, y, z, width, height, depth,cube, cut, json, newRack, rack);
	loadRackContent: function(box, x, y, z, width, height, depth, cube, cut, json, parent, oldRack) {
		var rackid = Number(oldRack.getClient('rackid'));
		var tempArr=[];
		var valueArr=[];
        var XHR=null;

        if($(".temp").hasClass("active")){
	        if (window.XMLHttpRequest) {
	            XHR = new XMLHttpRequest();
	        } else if (window.ActiveXObject) {
	            XHR = new ActiveXObject("Microsoft.XMLHTTP");
	        } else {
	            XHR = null;
	        }
	        if(XHR){
	        	var url='/api/racks/'+rackid+'/';
	            XHR.open("GET", url,false);
	            XHR.onreadystatechange = function () {
	                if (XHR.readyState == 4 && XHR.status == 200) {
	                    var data=eval("("+XHR.responseText+")");
	                    var nodes=data.rack.nodes;
	                    var chassis=data.rack.chassis;
	                    for(var i=0;i< nodes.length;i++){
	                    	tempArr.push({'id':nodes[i].id,'value':Number(nodes[i].temperature)});
	                    }
	                    XHR = null;
	                }
	            };
	            XHR.send();
	        };

			$('#color-tape').css('display',"block");
	        if (window.XMLHttpRequest) {
	            XHR = new XMLHttpRequest();
	        } else if (window.ActiveXObject) {
	            XHR = new ActiveXObject("Microsoft.XMLHTTP");
	        } else {
	            XHR = null;
	        }
	        if(XHR){
	        	var url='/api/3droom/temperature/';
	            XHR.open("GET", url,false);
	            XHR.onreadystatechange = function () {
	                if (XHR.readyState == 4 && XHR.status == 200) {
	                    data=eval("("+XHR.responseText+")");
	                    for(var i=0;i<data.length;i++){
	                    	for(var key in data[i]){
	                    		for(var j=0;j<data[i][key].length;j++){
	                    			valueArr.push(data[i][key][j].value)
	                    		}
	                    	}
	                    }
	                    XHR = null;
	                }
	            };
	            XHR.send();
	        }
			var num_min = Math.min.apply(null, valueArr);
			var num_max = Math.max.apply(null, valueArr);
			var num = (num_max - num_min) / 10;
			var stmp = num;
			$('.text-min').text(num_min+"℃");
			$('.text-max').text(num_max+"℃");
			// 色卡hover事件
			$(".color-icon i").off()
			$(".color-icon i").hover(function(){
				$('#color-tape-hover').css('display',"block");
				//----------------------悬浮框位置
				var width=$(window).width();
				$(document).mousemove(function(e){
					$('#color-tape-hover').css('top',e.pageY).css('left',e.pageX-width+30);
				});
				if($(this).index()  == 0){
					color_content_temp1 = num_min;
					color_content_temp2 = stmp + num_min;
				}else {
					if($(this).index() == 9){
						color_content_temp1 = stmp * 9 + num_min;
						color_content_temp2 = num_max;
					}else {
						color_content_temp1 = stmp * ($(this).index()) + num_min;
						color_content_temp2 = stmp * ($(this).index()+1) + num_min
					}
				}
				color_content = color_content_temp1 + "～" + color_content_temp2+ " "+"℃";
				$('#color-tape-hover').text(color_content)
			},function(){
				$('#color-tape-hover').css('display',"none");
			})
        }

		var servers = json.servers;
		var chassis = json.chassises;
		var label = oldRack.getClient('label');
		for (var jsonkey in servers) {
			if (label == jsonkey && servers[jsonkey].length > 0) {
				create(servers[jsonkey]);
			}
		}
		for (var jsonkey in chassis) {
			if (label == jsonkey && chassis[jsonkey].length > 0) {
				create(chassis[jsonkey]);
			}
		};
		function create(obj) {
			for (var i = 0; i < obj.length; i++) {
				var temp_Y = obj[i].position;
				var temp_H = obj[i].u;
				var server_type = obj[i].type;
				var id = obj[i].id;
				var server_img = obj[i].img || null;
				var card_json = obj[i];
				var idtext = "serverid";
				if (obj[i].type == "chassis") {
					idtext = "chassisid";
				}

				var number = temp_H;
				var pic = 'server' + number + '.jpg';
				var color = null;
				// chenjun
				if(demo.ServersId_arr.length>0){
					if(demo.contrastServersId(id)){
						color = "red";
					}
				}
				// chenjun end
				var server = demo.createServer(box, cube, cut, pic, color, oldRack, server_img, server_type, card_json,id,tempArr,num,num_min);
				// chenjun
				if(demo.ServersId_arr.length>0){
					demo.ServersIndexId_arr.push(server.getId());
				}
				// chenjun end
				server.setClient(idtext, id);

				var size = server.getBoundingBox().size();
				server.setPositionY(demo.setServerP(temp_Y, temp_H))
				server.setPositionZ(server.getPositionZ() + 4.5);
				server.setParent(parent);
			}
		}
	},
	// 创建机柜横向节点
	createServer: function(box, cube, cut, pic, color, oldRack, server_img, server_type, card_json,id,tempArr,num,num_min) {
		var picMap = {
			'server1.jpg': 4.45 * 1,
			'server2.jpg': 4.45 * 2,
			'server3.jpg': 4.45 * 3,
			'server4.jpg': 4.45 * 4,
			'server5.jpg': 4.45 * 5,
			'server6.jpg': 4.45 * 6,
			'server7.jpg': 4.45 * 7,
			'server8.jpg': 4.45 * 8,
			'server9.jpg': 4.45 * 9,
			'server10.jpg': 4.45 * 10,
		}
		var x = cube.getPositionX();
		var z = cube.getPositionZ();
		var width = cut.getWidth() - 2.5;
		var height = picMap[pic];
		var depth = cut.getDepth();

		var serverBody = new mono.Cube(width - 2, height - 2, depth - 4);

		var bodyColor = color ? color : '#5B6976';

		serverBody.s({
			'm.color': bodyColor,
			'm.ambient': bodyColor,
			'm.type': 'phong',
			'm.texture.image': demo.getRes('rack_inside.jpg'),
		});

		serverBody.setPosition(-0.5, 0.5, (cube.getDepth() - serverBody.getDepth()) / 2);

		var serverPanel = new mono.Cube(width + 2, height, 0.5);
		var tempValue;
		if ($(".temp").hasClass("active")) {
			for(i=0;i<tempArr.length;i++){
				if(tempArr[i].id==id){
					tempValue=tempArr[i].value;
				}
			}
			var Tempcolor = demo.createColor(num, num_min, tempValue);
			color = Tempcolor;
			serverPanel.s({
				'm.texture.image': demo.getRes('rack_inside.jpg'),
				'front.m.texture.color': color,
				'front.m.texture.repeat': new mono.Vec2(1, 1),
				'm.specularStrength': 100,
				'm.transparent': false,
				'front.m.color': color,
				'front.m.ambient': color,
			});
		} else {
			color = color ? color : '#ffffff';
			serverPanel.s({
				'm.texture.image': demo.getRes('rack_inside.jpg'),
				'front.m.texture.image': demo.RES_PATH + '/' + (server_img || pic),
				'front.m.texture.repeat': new mono.Vec2(1, 1),
				'm.specularStrength': 100,
				'front.m.color': color,
				'front.m.ambient': color,
			});
		};
		serverPanel.setPosition(-0.5, 0, serverBody.getDepth() / 2 + (cube.getDepth() - serverBody.getDepth()) / 2);
		if (server_type == 'chassis') {
			var serverColor = null;
			if ($(".temp").hasClass("active")) {
				serverPanel.s({
					'm.color': serverColor,
					'm.ambient': serverColor,
					'm.transparent': true,
					'm.texture.image': demo.getRes(server_img || 'servers-img/re_chassis.png'),
				});

			} else {
				serverPanel.s({
					'm.color': serverColor,
					'm.ambient': serverColor,
					'm.transparent': true,
					'm.texture.image': demo.getRes(server_img || 'servers-img/re_chassis.png'),
				});
			}
		}

		// ComboNode  组合体 —— 由运算体封装而来的组合体，使用起来更加方便，只需传入运算符即可完成复杂的运算
		var server = new mono.ComboNode([serverBody, serverPanel], ['+']);
		//server.setRotation(0, Math.PI/180 * 90, 0);
		server.setClient('animation', 'pullOut.z');
		server.setClient('type', 'drawer');
		server.setClient('dbl.func', demo.showCardTable);
		server.setPosition(0.5, 0, -5);
		box.add(server);

		if (server_type == 'chassis') {
			//********************************************************************************************************************        	
			server.setClient('type', 'chassis');
			//********************************************************************************************************************  
			var cards = card_json.cards;
			var xoffset = 2.1008,
				yoffset = 0.9897;
			var width = width + 2;
			var height = height + 1;
			var cardWidth = (width - xoffset * 2) / 2;
			var count = cards.length;
			for (var i = 0; i < count; i++) {
				//  此处温度值随机模拟
				// var tempValue = Math.random() * 100 + 20;
				// var cha_color = demo.createColor(num, num_min, tempValue);
				var card_id=cards[i].id;
				var id = cards[i].id;
				var position = cards[i].position;
				var params = {
					'height': ((height - yoffset * 2) / 7) - 1.35,
					'width': cardWidth - 0.5,
					'depth': depth * 0.9,
					'pic': demo.RES_PATH + '/' + (cards[i].img || 'servers-img/1.FSM ITME.png'),
					'id': card_id
				};
				// chenjun
				if(demo.ServersId_arr.length>0){
					if(demo.contrastServersId(id)){
						params.serchColor = "red";
					}
				}
				// chenjun end
				var card = demo.createCard(params,tempArr,num,num_min);
				box.add(card);
				var cardX = -11.7
				if (position % 2 == 0) {
					position = position / 2;
					cardX = 10.8;
				} else {
					position = (position + 1) / 2
				}
				var cardY = -16.2 + (3.5958 * (position - 1)) + position;
				card.setParent(server);
				card.setClient('cardid', cards[i].id);
				card.setClient('type', 'card');
				card.setClient('dbl.func', demo.showCardTable);
				card.setClient('BID', 'card-' + i);
				card.p(cardX, cardY, serverPanel.getPositionZ() - 1);
				card.setClient('animation', 'pullOut.z');
				// chenjun
				if(demo.ServersId_arr.length>0){
					demo.ServersIndexId_arr.push(card.getId());
				}
				// chenjun end
			}
		}

		return server;
	},

	createCard: function(json,tempArr,num,num_min) {
		var translate = json.translate || [0, 0, 0];
		var x = translate[0],
			y = translate[1],
			z = translate[2];
		var width = json.width || 10,
			height = json.height || 50,
			depth = json.depth || 50;
		var rotate = json.rotate || [0, 0, 0];
		var color = json.cha_color || 'white';
		var id=json.id;
		var pic = json.pic || demo.getRes('card1.png');
		var serchColor = json.serchColor || null;
		if ($(".temp").hasClass("active")) {
			for(i=0;i<tempArr.length;i++){
				if(tempArr[i].id==id){
					tempValue=tempArr[i].value;
				}
			}
			var Tempcolor = demo.createColor(num, num_min, tempValue);
			color=Tempcolor;
			var style = {
				'front.m.color': color,
				'front.m.ambient': color,
				'm.texture.image': demo.getRes('gray.png'),
				'front.m.texture.color': color,
				'back.m.texture.image': pic,
			}
		} else {
			var style = {
				'm.color': serchColor,
				'm.ambient': serchColor,
				'm.texture.image': demo.getRes('gray.png'),
				'front.m.texture.image': pic,
				'back.m.texture.image': pic,
			}
		}

		var parts = [{
			//card panel
			type: 'cube',
			width: width,
			height: height,
			depth: 1,
			translate: [x, y, z + 1],
			rotate: rotate,
			op: '+',
			style: style
		}, {
			//card body
			type: 'cube',
			width: width * 0.95,
			height: 1,
			depth: depth,
			translate: [x, y + 1.5, z - depth / 2 + 1],
			rotate: rotate,
			op: '+',
			style: {
				'm.color': 'gray',
				'm.ambient': 'gray',
				'm.texture.image': demo.getRes('gray.png'),
				'top.m.texture.image': demo.getRes('card_body.png'),
				'bottom.m.texture.image': demo.getRes('card_body.png'),
				'left.m.texture.flipX': true,
				'm.lightmap.image': demo.getRes('outside_lightmap.jpg'),
			}
		}];

		return demo.createCombo(parts);
	},
	//***************************************************************************************************************************************************************
	rack_monitor_overview: function() {

		//    alert("点击了这扇门！！！");

		//添加mouseover监视器

		network.getRootView().addEventListener("dblclick", function(e) {

			//******************************************************************************************************************           
			//添加mouseover监视器
			var firstClickObject = network.getFirstElementByMouseEvent(e, false);

			if (firstClickObject) {

				// console.log(firstClickObject);

				var element = firstClickObject.element;

				// console.log(element.getClient("serverid"));

				// console.log(element.getClient("type"));

				// console.log(element);
				//*******************************************************************************************************************  
				if (element.getClient("type") == "rack.door") {

					// console.log("这是一个rack door");

					rack_door = element;

					room_info = element.getClient("innerId");

					// console.log(room_info);

					var select_rack_id = rack_door.getClient('rackid');

					// console.log(select_rack_id);

					var idArray = [];

					for (x in room_info) {

						if (x == select_rack_id) {

							// console.log(room_info[x]);

							var rack_inner_content = room_info[x];

							for (var item in rack_inner_content) {

								// console.log(rack_inner_content[item]);

								var select_id = rack_inner_content[item].id


								$.ajax({
									type: "get",
									url: "http://" + window.location.hostname + ":8080/api/nodes/" + select_id + "/tendency/hour/temperature/",
									async: true,
									success: function(res) {

										var theLastIndex = res.history.length - 1;

										var temperature_resoult = res.history[theLastIndex].value;

										idArray.push(temperature_resoult);

										// console.log(idArray);
									},
									error: function(res) {

										// console.log("temperature ajax error");

									}
								});



							}

						}
					}


				}
				//*******************************************************************************************************************
			}

		});
		//        	alert("点击了这扇门！！！");
	},
	//***************************************************************************************************************************************************************
	showCardTable: function() {

		//添加mouseover监视器
		network.getRootView().addEventListener("dblclick", function(e) {
			//添加mouseover监视器
			var firstClickObject = network.getFirstElementByMouseEvent(e, false);

			if (firstClickObject) {
				var element = firstClickObject.element;
				if (element.getClient("type") == "drawer") {
					//alert("你点击的是一个节点！");
					$.ajax({
						type: "get",
						url: "http://" + window.location.hostname + ":8080/api/nodes/" + element.getClient("serverid") + "/",
						//url:"../../../static/js/libs/3d_libs/data/node_data.json",
						success: function(res) {
							var data = res.node;
							$.each(data, function(index, item) {
								if (index == "hostname") {
									$("#node_data_hostname").html(item);
								}
								if (index == "status") {
									//判断状态
									var strObj = item;

									if (strObj == "Idle") {

										strObj = "空闲";
										$("#node_data_status").html(strObj);
										$("#node_data_status_picture").css("background-color", "rgb(143,233,165)");

									} else if (strObj == "Busy") {

										strObj = "忙碌";
										$("#node_data_status").html(strObj);
										$("#node_data_status_picture").css("background-color", "rgb(255,204,0)");

									} else if (strObj == "Used") {

										strObj = "占用";
										$("#node_data_status").html(strObj);
										$("#node_data_status_picture").css("background-color", "rgb(253,241,0)");
										$("#node_data_status_picture").css("margin-left", "0px");

									} else if (strObj == "Off") {

										strObj = "关机";
										$("#node_data_status").html(strObj);
										$("#node_data_status_picture").css("background-color", "rgb(222,222,222)");

									}


								}

								if (index == "type") {
									var stringArr = new Array();

									stringArr = item.split(",");

									$.each(stringArr, function(i, type) {
										switch (type.toLowerCase()) {
											case "head":
												stringArr[i] = "管理节点,";
												break;
											case "compute":
												stringArr[i] = "计算节点,";
												break;
											case "gpu":
												stringArr[i] = "gpu节点,";
												break;
											case "io":
												stringArr[i] = "io节点,";
												break;
											case "login":
												stringArr[i] = "登陆节点,";
												break;
										}

									});

									$("#node_data_type").html(stringArr);

								}
								if (index == "mgt_ipv4") {

									$("#node_data_mgt_ipv4").html(item);

								}

								if (index == "bmc_ipv4") {

									$("#node_data_bmc_ipv4").html(item);

								}

								if (index == "memory_total") {

									var memory = parseInt(item / 1024) + "";

									var memoryResoult = memory + "G"

									$("#node_data_memory_total_kb").html(memoryResoult);

								}
								if (index == "disk_total") {

									var disk = item + "G";

									$("#node_data_disk_total_gb").html(disk);
								}

								if (index == "groups") {

									$("#node_data_groups").html(item);
								}

								if (index == "machinetype") {

									$("#node_data_machine_model").html(item);
								}

								if (index == "power_status") {

									if (item == "On") {

										$(".new_icon_monitor_turn_icon").addClass("new_icon_monitor_turn_off");
										$(".new_icon_monitor_turn_character").html("nls.shutdown");

									} else if (item == "Off") {

										$(".new_icon_monitor_turn_icon").addClass("new_icon_monitor_turn_on");
										$(".new_icon_monitor_turn_character").html("nls.open");

									}

								}

								if (index == "processors_total") {

									$("#node_data_processors_total").html(item + "核");

								}
							});

						}
					});
					//*************************************************************************************************************
					//cpu使用率
					$.ajax({
						type: "get",
						url: "http://" + window.location.hostname + ":8080/api/nodes/" + element.getClient("serverid") + "/tendency/hour/cpu/",
						//url:"../../../static/js/libs/3d_libs/data/last_hour_history_cpu.json",
						async: true,
						success: function(res) {


							var theLastIndex = res.history.length - 1;
							var cpuCurrent = res.history[theLastIndex].value;
							$("#cpu_current_value").html(cpuCurrent);
						},
						error: function(res) {
							console.log("ajax error");
						}
					});
					//*************************************************************************************************************
					//内存使用率
					$.ajax({
						type: "get",
						url: "http://" + window.location.hostname + ":8080/api/nodes/" + element.getClient("serverid") + "/tendency/hour/memory/",
						//url:"../../../static/js/libs/3d_libs/data/last_hour_history_cpu.json",
						async: true,
						success: function(res) {

							var theLastIndex = res.history.length - 1;

							$("#memory_current_value").html(res.history[theLastIndex].value);

						},
						error: function(res) {
							console.log("ajax error");
						}
					});
					//*************************************************************************************************************
					//网络使用率
					$.ajax({
						type: "get",
						url: "http://" + window.location.hostname + ":8080/api/nodes/" + element.getClient("serverid") + "/tendency/hour/network/",
						//url:"../../../static/js/libs/3d_libs/data/last_hour_history_cpu.json",
						async: true,
						success: function(res) {

							var theLastIndex = res.history.length - 1;

							$("#network_current_value").html(res.history[theLastIndex].value);
						},
						error: function(res) {
							console.log("ajax error");
						}
					});
					//*************************************************************************************************************
					//硬盘使用率
					$.ajax({
						type: "get",
						url: "http://" + window.location.hostname + ":8080/api/nodes/" + element.getClient("serverid") + "/tendency/hour/disk/",
						//url:"../../../static/js/libs/3d_libs/data/last_hour_history_cpu.json",
						async: true,
						success: function(res) {

							var theLastIndex = res.history.length - 1;

							$("#disk_current_value").html(res.history[theLastIndex].value);
						},
						error: function(res) {
							console.log("ajax error");
						}
					});
					//*************************************************************************************************************
					//温度使用率
					$.ajax({
						type: "get",
						url: "http://" + window.location.hostname + ":8080/api/nodes/" + element.getClient("serverid") + "/tendency/hour/temperature/",
						//url:"../../../static/js/libs/3d_libs/data/last_hour_history_cpu.json",
						async: true,
						success: function(res) {

							var theLastIndex = res.history.length - 1;

							$("#temperature_current_value").html(res.history[theLastIndex].value);
						},
						error: function(res) {
							console.log("ajax error");
						}
					});
					//*************************************************************************************************************
					//能耗
					$.ajax({
						type: "get",
						url: "http://" + window.location.hostname + ":8080/api/nodes/" + element.getClient("serverid") + "/tendency/hour/energy/",
						//url:"../../../static/js/libs/3d_libs/data/last_hour_history_cpu.json",
						async: true,
						success: function(res) {

							var theLastIndex = res.history.length - 1;

							$("#energy_current_value").html(res.history[theLastIndex].value);
						},
						error: function(res) {
							console.log("ajax error");
						}
					});
					//*************************************************************************************************************
					//load
					$.ajax({
						type: "get",
						url: "http://" + window.location.hostname + ":8080/api/nodes/" + element.getClient("serverid") + "/tendency/hour/load/",
						//url:"../../../static/js/libs/3d_libs/data/last_hour_history_cpu.json",
						async: true,
						success: function(res) {

							var theLastIndex = res.history.length - 1;

							$("#load_current_value").html(res.history[theLastIndex].value);
						},
						error: function(res) {
							console.log("ajax error");
						}
					});
					//*************************************************************************************************************       

					tipDiv.style.visibility = "visible";

				}



			} else {

				tipDiv.style.visibility = "hidden";

			}
			//如果有物体，显示div并显示其信息，否则，隐藏div



		});
	},

	setServerP: function(temp_Y, temp_H) {
		var number, temp;
		switch (temp_H) {
			case 1:
				temp = 0;
				break
			case 2:
				temp = 0.55;
				break
			case 3:
				temp = 1.1;
				break
			case 4:
				temp = 1.65;
				break
			case 5:
				temp = 2;
				break
			case 6:
				temp = 2.55;
				break
			case 7:
				temp = 3.1;
				break
			case 8:
				temp = 3.55;
				break
			case 9:
				temp = 4.1;
				break
			case 10:
				temp = 4.6;
				break
		}
		return number = -94.5 + (4.6 * ((temp_Y - temp_H) + temp))
	},
	// chenjun
	contrastServersId:function(id){
		var arr = demo.ServersId_arr;
		var key = false;
		for(var i=0;i<arr.length;i++){
			if(arr[i] == id){
				key = true;
			}
		}
		return key
	},
	// chenjun end
	createShadowImage: function(box, floorWidth, floorHeight) {
		var canvas = document.createElement('canvas');
		canvas['width'] = floorWidth;
		canvas['height'] = floorHeight;
		var context = canvas.getContext('2d');
		context.beginPath();
		context.rect(0, 0, floorWidth, floorHeight);
		context.fillStyle = 'white';
		context.fill();

		var marker = function(context, text, text2, x, y) {
			var color = '#0B2F3A'; //'#0B2F3A';//'#FE642E';
			context.font = 60 + 'px "Microsoft Yahei" ';
			context.fillStyle = color;
			context.textAlign = 'center';
			context.textBaseline = 'middle';
			//context.shadowBlur = 30;
			context.fillText(text, x, y);
			context.strokeStyle = color;
			context.lineWidth = 3;
			context.strokeText(text, x, y);

			if (!text2) return;
			y += 52;
			color = '#FE642E';
			context.font = 26 + 'px "Microsoft Yahei" ';
			context.fillStyle = color;
			context.textAlign = 'center';
			context.textBaseline = 'middle';
			context.fillText(text2, x, y);
		}

		//marker(context, 'Lenovo', '', 530, 500);
		// marker(context, '乐视', '192.168.1.150', 590, 1000);
		// marker(context, '亚马逊', 'ip待分配', 1020, 1000);

		box.forEach(function(object) {
			if (object instanceof mono.Entity && object.shadow) {
				var translate = object.getPosition() || {
					x: 0,
					y: 0,
					z: 0
				};
				var rotate = object.getRotation() || {
					x: 0,
					y: 0,
					z: 0
				};
				var rotate = -rotate[1];

				demo.paintShadow(object, context, floorWidth, floorHeight, translate, rotate);
			}
		});

		return canvas;
	},

	paintShadow: function(object, context, floorWidth, floorHeight, translate, rotate) {
		var type = object.getClient('type');
		var shadowPainter = demo.getShadowPainter(type);

		if (shadowPainter) {
			shadowPainter(object, context, floorWidth, floorHeight, translate, rotate);
		}
	},

	findFirstObjectByMouse: function(network, e) {
		var objects = network.getElementsByMouseEvent(e);
		if (objects.length) {
			for (var i = 0; i < objects.length; i++) {
				var first = objects[i];
				var object3d = first.element;
				if (!(object3d instanceof mono.Billboard)) {
					return first;
				}
			}
		}
		return null;
	},

	animateCamera: function(camera, interaction, oldPoint, newPoint, onDone) {
		//twaver.Util.stopAllAnimates(true);

		var offset = camera.getPosition().sub(camera.getTarget());
		var animation = new twaver.Animate({
			from: 0,
			to: 1,
			dur: 500,
			easing: 'easeBoth',
			onUpdate: function(value) {
				var x = oldPoint.x + (newPoint.x - oldPoint.x) * value;
				var y = oldPoint.y + (newPoint.y - oldPoint.y) * value;
				var z = oldPoint.z + (newPoint.z - oldPoint.z) * value;
				var target = new mono.Vec3(x, y, z);
				camera.lookAt(target);
				interaction.target = target;
				var position = new mono.Vec3().addVectors(offset, target);
				camera.setPosition(position);
			},
		});
		animation.onDone = onDone;
		animation.play();
	},

	playAnimation: function(element, animation, done) {
		var params = animation.split('.');
		if (params[0] === 'pullOut') {
			var direction = params[1];
			demo.animatePullOut(element, direction, done);
		}
		if (params[0] === 'rotate') {
			var anchor = params[1];
			var angle = params[2];
			var easing = params[3];
			demo.animateRotate(element, anchor, angle, easing, done);
		}
	},

	animatePullOut: function(object, direction, done) {
		//twaver.Util.stopAllAnimates(true);

		var size = object.getBoundingBox().size().multiply(object.getScale());

		var movement = 0.8;

		var directionVec = new mono.Vec3(0, 0, 1);
		var distance = 0;
		if (direction === 'x') {
			directionVec = new mono.Vec3(1, 0, 0);
			distance = size.x;
		}
		if (direction === '-x') {
			directionVec = new mono.Vec3(-1, 0, 0);
			distance = size.x;
		}
		if (direction === 'y') {
			directionVec = new mono.Vec3(0, 1, 0);
			distance = size.y;
		}
		if (direction === '-y') {
			directionVec = new mono.Vec3(0, -1, 0);
			distance = size.y;
		}
		if (direction === 'z') {
			directionVec = new mono.Vec3(0, 0, 1);
			distance = size.z;
		}
		if (direction === '-z') {
			directionVec = new mono.Vec3(0, 0, -1);
			distance = size.z;
		}

		distance = distance * movement;
		if (object.getClient('animated')) {
			directionVec = directionVec.negate();
		}

		var fromPosition = object.getPosition().clone();
		object.setClient('animated', !object.getClient('animated'));

		new twaver.Animate({
			from: 0,
			to: 1,
			dur: 2000,
			easing: 'bounceOut',
			onUpdate: function(value) {
				//don't forget to clone new instance before use them!
				object.setPosition(fromPosition.clone().add(directionVec.clone().multiplyScalar(distance * value)));
			},
			onDone: function() {
				demo.animationFinished(object);

				if (done) {
					done();
				}
			},
		}).play();
	},

	animateRotate: function(object, anchor, angle, easing, done) {
		//twaver.Util.stopAllAnimates(true);
		easing = easing || 'easeInStrong';

		var size = object.getBoundingBox().size().multiply(object.getScale());

		var from = 0;
		var to = 1;
		if (object.getClient('animated')) {
			to = -1;
		}
		object.setClient('animated', !object.getClient('animated'));

		var position;
		var axis;
		if (anchor === 'left') {
			position = new mono.Vec3(-size.x / 2, 0, 0);
			var axis = new mono.Vec3(0, 1, 0);
		}
		if (anchor === 'right') {
			position = new mono.Vec3(size.x / 2, 0, 0);
			var axis = new mono.Vec3(0, 1, 0);
		}

		var animation = new twaver.Animate({
			from: from,
			to: to,
			dur: 1500,
			easing: easing,
			onUpdate: function(value) {
				if (this.lastValue === undefined) {
					this.lastValue = 0;
				}
				object.rotateFromAxis(axis.clone(), position.clone(), Math.PI / 180 * angle * (value - this.lastValue));
				this.lastValue = value;
			},
			onDone: function() {
				delete this.lastValue;
				demo.animationFinished(object);

				if (done) {
					done();
				}
			},
		});
		animation.play();
	},

	animationFinished: function(element) {
		var animationDoneFuc = element.getClient('animation.done.func');
		if (animationDoneFuc) {
			animationDoneFuc();
		}
	},

	getRandomInt: function(max) {
		return parseInt(Math.random() * max);
	},

	getRandomLazyTime: function() {
		var time = demo.LAZY_MAX - demo.LAZY_MIN;
		return demo.getRandomInt(time) + demo.LAZY_MIN;
	},
	// rack顶部canvas画字
	generateAssetImage: function(text, pos) {
		var width = 512,
			height = 256;

		var canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height;

		var ctx = canvas.getContext('2d');
		ctx.fillStyle = 'white';
		ctx.fillRect(0, 0, width, height);

		ctx.font = 150 + 'px "Microsoft Yahei" ';
		ctx.fillStyle = 'black';
		ctx.textAlign = pos;
		ctx.textBaseline = 'middle';
		ctx.fillText(text, width / 2, height / 2);
		ctx.strokeStyle = 'black';
		ctx.lineWidth = 15;
		ctx.strokeText(text, width / 2, height / 2);

		return canvas;
	},

	createColor: function(stmp, num_min, num) {
		if (num < stmp + num_min) {
			return "#00FF00";
		}
		if(num >= stmp + num_min && num < stmp * 2 + num_min){
			return "#96FF00";
		}
		if(num >= stmp * 2 + num_min && num < stmp * 3 + num_min){
			return "#DCFF00";
		}
		if(num >= stmp * 3 + num_min && num < stmp * 4 + num_min){
			return "#FFFF00";
		}
		if(num >= stmp * 4 + num_min && num < stmp * 5 + num_min){
			return "#FFDC00";
		}
		if(num >= stmp * 5 + num_min && num < stmp * 6 + num_min){
			return "#FFB400";
		}
		if(num >= stmp * 6 + num_min && num < stmp * 7 + num_min){
			return "#FF9600";
		}
		if(num >= stmp * 7 + num_min && num < stmp * 8 + num_min){
			return "#FF6E00";
		}
		if(num >= stmp * 8 + num_min && num < stmp * 9 + num_min){
			return "#FF4100";
		}
		if(num >= stmp * 9 + num_min){
			return "#FF0000";
		}
	},

	toggleTemperatureView: function(network) {
		// 默认png图片从上往下
		function draw(obj) {
			var ctx = document.getElementById('canvas').getContext('2d');
			var single = 200 / 42;
			for (var i = 0; i < 42; i++) {
				ctx.fillStyle = obj[i][1];
				ctx.fillRect(0, i * single, 1, 200);
			}
		};

		function base64Img2Blob(code) {
			var parts = code.split(';base64,');
			var contentType = parts[0].split(':')[1];
			// console.log(parts + " \n " + parts[0] + "\n " + parts[1])
			// 解码 window.atob
			var raw = window.atob(parts[1]);
			var rawLength = raw.length;

			var uInt8Array = new Uint8Array(rawLength);

			for (var i = 0; i < rawLength; ++i) {
				uInt8Array[i] = raw.charCodeAt(i);
			}

			return new Blob([uInt8Array], {
				type: contentType
			});
		}

		function createRackImage(fileName, content) {

			var aLink = document.createElement('img');
			var blob = base64Img2Blob(content);
			aLink.src = URL.createObjectURL(blob);
			return aLink.src;
		}

		function getImage(filename, obj) {
			draw(obj)
			return createRackImage(filename + '.png', canvas.toDataURL("image/png"));
		}
		var tempArr=[];
		var valueArr=[];
		var idArr=[];
        var XHR=null;
        var data;
        if (window.XMLHttpRequest) {
            XHR = new XMLHttpRequest();
        } else if (window.ActiveXObject) {
            XHR = new ActiveXObject("Microsoft.XMLHTTP");
        } else {
            XHR = null;
        }
        if(XHR){
        	var url='/api/3droom/temperature/';
            XHR.open("GET", url,false);
            XHR.onreadystatechange = function () {
                if (XHR.readyState == 4 && XHR.status == 200) {
                    data=eval("("+XHR.responseText+")");
                    for(var i=0;i<data.length;i++){
                    	for(var key in data[i]){
                    		for(var j=0;j<data[i][key].length;j++){
                    			valueArr.push(data[i][key][j].value);
                    			idArr.push([data[i][key][j].id,data[i][key][j].value])
                    		}
                    	}
                    }
                    XHR = null;
                }
            };
            XHR.send();
        }

		var num_min = Math.min.apply(null, valueArr);
		var num_max = Math.max.apply(null, valueArr);
		var num = (num_max - num_min) / 10;

		var stmp = num;
		$('.text-min').text(num_min+"℃");
		$('.text-max').text(num_max+"℃");
		// 色卡hover事件
		$(".color-icon i").off()
		$(".color-icon i").hover(function(){
			$('#color-tape-hover').css('display',"block");
			//----------------------悬浮框位置
			var width=$(window).width();
			$(document).mousemove(function(e){
				$('#color-tape-hover').css('top',e.pageY).css('left',e.pageX-width+30);
			});
			if($(this).index()  == 0){
				color_content_temp1 = num_min;
				color_content_temp2 = stmp + num_min;
			}else {
				if($(this).index() == 9){
					color_content_temp1 = stmp * 9 + num_min;
					color_content_temp2 = num_max;
				}else {
					color_content_temp1 = stmp * ($(this).index()) + num_min;
					color_content_temp2 = stmp * ($(this).index()+1) + num_min
				}
			}
			color_content = color_content_temp1 + "～" + color_content_temp2+ " "+"℃";
			$('#color-tape-hover').text(color_content)
		},function(){
			$('#color-tape-hover').css('display',"none");
		})
        // console.log(JSON.stringify(valueArr));

		// network.temperatureView = !network.temperatureView;
		network.getDataBox().forEach(function(element) {
			var type = element.getClient('type');
			if (type === 'rack' || type === 'rack.door') {
				// 机架显示或者隐藏,如果处于温度全景图就不显示，否则显示
				element.setVisible(false);

				if (type === 'rack') {
					var rackid = element.getClient('rackid');
					// console.log(JSON.stringify(idArr))
					// if (!element.temperatureFake1 && !element.temperatureFake2) {
					var server = element.getClient('server');
					var chassis = element.getClient('chassis');

					var item_left = [],
						item_right = [];
					for (var i = 42; i > 0; i--) {
						for (var j = 0; j < server.length; j++) {
							if (server[j].position == i) {
								var u = server[j].u;
								var id = server[j].id;
								var tempValue;
								for(var k=0;k<idArr.length;k++){
									if(idArr[k][0]==id){
										tempValue=idArr[k][1]
									}
								}
								var Tempcolor = demo.createColor(num, num_min, tempValue);
								for (var h = 0; h < u; h++) {
									item_left.push([i - h, Tempcolor, 'server']);
									item_right.push([i - h, Tempcolor, 'server']);
								}
								i = i - u;
							}
						};
						for (var j = 0; j < chassis.length; j++) {
							var cha_pos = chassis[j].position;
							var cards = chassis[j].cards;
							if (cha_pos == i) {
								for (var h = 13; h >= 0; h--) {
									for (var k = cards.length - 1; k >= 0; k--) {
										if (cards[k].position - 1 == h) {
											if (cards[k].position % 2 != 0) {
												var id = cards[k].id;
												var tempValue;
												for(var p=0;p<idArr.length;p++){
													if(idArr[p][0]==id){
														tempValue=idArr[p][1]
													}
												}
												var Tempcolor = demo.createColor(num, num_min, tempValue);
												var card_pos = cha_pos + (cards[k].position + 1) / 2 - 7;
												item_left.push([card_pos, Tempcolor, 'chassis']);
												h = h - 1;
											} else {
												var id = cards[k].id;
												var tempValue;
												for(var p=0;p<idArr.length;p++){
													if(idArr[p][0]==id){
														tempValue=idArr[p][1]
													}
												}
												var Tempcolor = demo.createColor(num, num_min, tempValue);
												var card_pos = cha_pos + cards[k].position / 2 - 7;
												item_right.push([card_pos, Tempcolor, 'chassis']);
												h = h - 1;
											}
										}
									}
									// 在chassis的左边
									if (h % 2 == 0 && h >= 0) {
										var card_pos_left = cha_pos + h / 2 - 6;
										item_left.push([card_pos_left, '#fff', 'chassis']);
									} else if (h >= 0) {
										var card_pos_right = cha_pos + (h - 1) / 2 - 6;
										item_right.push([card_pos_right, '#fff', 'chassis']);
									}
								}
								item_left.push([i - 7, '#fff', 'null']);
								item_right.push([i - 7, '#fff', 'null']);
								i = i - 8;
								break;
							}
						};
						for (var j = 0; j < server.length; j++) {
							if (server[j].position == i) {
								var id = server[j].id;
								var tempValue;
								for(var k=0;k<idArr.length;k++){
									if(idArr[k][0]==id){
										tempValue=idArr[k][1]
									}
								}
								var Tempcolor = demo.createColor(num, num_min, tempValue);
								for (var h = 0; h < u; h++) {
									item_left.push([i - h, Tempcolor, 'server']);
									item_right.push([i - h, Tempcolor, 'server']);
								}
								i = i - u;
							}
						};
						item_left.push([i, '#fff', 'server']);
						item_right.push([i, '#fff', 'server']);
					}

					var fake1 = new mono.Cube(element.getWidth() / 2, element.getHeight(), element.getDepth());
					var fake2 = new mono.Cube(element.getWidth() / 2, element.getHeight(), element.getDepth());
					// 获取创建的cube唯一id并保存，为了以后销毁
					demo.Fake_arr.push(fake1.getId());
					demo.Fake_arr.push(fake2.getId());
					var sideImage1 = getImage(rackid + 'left', item_left);
					var label = element.getClient('label');
					label_l = label.split("").splice(0, 2).join(" ");
					var labelCanvas_l = demo.generateAssetImage(label_l, "left");
					fake1.setStyle('top.m.texture.image', labelCanvas_l);
					fake1.setStyle('top.m.specularmap.image', labelCanvas_l);

					fake1.s({
						// 6面的温度image
						'left.m.texture.image': sideImage1,
						'right.m.texture.image': null,
						'front.m.texture.image': sideImage1,
						'back.m.texture.image': sideImage1,
						'top.m.texture.image': fake1.getStyle('top.m.texture.image'),
						// 头上的颜色
						'top.m.normalmap.image': demo.getRes('metal_normalmap_l.jpg'),
						'top.m.specularmap.image': fake1.getStyle('top.m.texture.image'),
						'top.m.envmap.image': demo.getEnvMap(),
						'top.m.type': 'phong',
					});
					// fake2
					
					var sideImage2 = getImage(rackid + 'right', item_right);;

					label_r = label.split("").splice(2, 2).join(" ");
					var labelCanvas_r = demo.generateAssetImage(label_r, "right");
					fake2.setStyle('top.m.texture.image', labelCanvas_r);
					fake2.setStyle('top.m.specularmap.image', labelCanvas_r);

					fake2.s({
						'left.m.texture.image': null,
						'right.m.texture.image': sideImage2,
						'front.m.texture.image': sideImage2,
						'back.m.texture.image': sideImage2,
						'top.m.texture.image': fake2.getStyle('top.m.texture.image'),
						// 头上的颜色
						'top.m.normalmap.image': demo.getRes('metal_normalmap_r.jpg'),
						'top.m.specularmap.image': fake2.getStyle('top.m.texture.image'),
						'top.m.envmap.image': demo.getEnvMap(),
						'top.m.type': 'phong',
					});

					element.temperatureFake1 = fake1;
					element.temperatureFake2 = fake2;
					network.getDataBox().add(fake1);
					network.getDataBox().add(fake2);
					// }
					var x = element.getPositionX();
					var y = element.getPositionY();
					var z = element.getPositionZ();
					element.temperatureFake1.setPosition(x - 15, y, z);
					element.temperatureFake2.setPosition(x + element.getWidth() / 2 - 15, y, z);

					element.temperatureFake1.setVisible(true);
					element.temperatureFake2.setVisible(true);
				}
			}

		});	
	},

	toggleUsageView: function(network) {
		network.usageView = !network.usageView;

		network.getDataBox().forEach(function(element) {
			var type = element.getClient('type');

			if (type === 'rack' || type === 'rack.door') {
				element.setVisible(!network.usageView);
				if (type === 'rack') {
					if (!element.usageFakeTotal) {
						var usage = Math.random();
						var usage_1;
						var color = demo.getHSVColor((1 - usage) * 0.9, 1, 1);

						var usageFakeTotal = new mono.Cube(element.getWidth(), element.getHeight(), element.getDepth());
						element.usageFakeTotal = usageFakeTotal;
						usageFakeTotal.s({
							'm.wireframe': true,
							'm.transparent': true,
							'm.opacity': 0.1,
						});
						usageFakeTotal.setPosition(element.getPosition());
						network.getDataBox().add(usageFakeTotal);

						//console.log(element.getHeight());

						//***********************************************************************************************************************
						//***********************************************************************************************************************

						var select_rack_id = element.getClient('label');
						// console.log(select_rack_id)

						//console.log(select_rack_id);

						var innerId = element.getClient('innerId');

						// console.log(innerId);

						for (x in innerId) {

							if (x == select_rack_id) {

								var usageHeight = 0;

								//console.log(innerId[x]);

								var rack_inner_content = innerId[x];
								// console.log(rack_inner_content)
								for (var item in rack_inner_content) {


									// usageHeight.push(rack_inner_content[item].u);
									// console.log(rack_inner_content[item].u)
									usageHeight = usageHeight + rack_inner_content[item].u;

									// console.log(usageHeight);

								}
								usage = usageHeight / 42;

								//console.log(usage);
							}
						}
						//***********************************************************************************************************************
						//***********************************************************************************************************************
						var chassises_number = element.getClient('chassisesId');
						// console.log(JSON.stringify(chassises_number))

						for (x in chassises_number) {

							if (x == select_rack_id) {

								var totle_chassises_number = chassises_number[x][0].u;
								console.log(JSON.stringify(chassises_number[x]))
								usage_1 = totle_chassises_number / 42;

							}
						}
						//**************************************************************************************
						//**************************************************************************************
						var height = element.getHeight() * (usage + usage_1);

						console.log(height);

						var usageFakeUsed = new mono.Cube(element.getWidth(), 0, element.getDepth());
						element.usageFakeUsed = usageFakeUsed;
						usageFakeUsed.s({
							'm.type': 'phong',
							'm.color': color,
							'm.ambient': color,
							'm.specularStrength': 20
						});
						usageFakeUsed.setPosition(element.getPosition());
						usageFakeUsed.setPositionY(0);
						network.getDataBox().add(usageFakeUsed);

						var usageAnimation = new twaver.Animate({
							from: 0,
							to: height,
							type: 'number',
							dur: 3000,
							delay: Math.random() * 200,
							easing: 'bounceOut',
							onUpdate: function(value) {
								usageFakeUsed.setHeight(value);
								usageFakeUsed.setPositionY(usageFakeUsed.getHeight() / 2);
							},
						});
						element.usageAnimation = usageAnimation;
					}

					element.usageFakeTotal.setVisible(network.usageView);
					element.usageFakeUsed.setVisible(network.usageView);
					element.usageFakeTotal.setPosition(element.getPosition().clone());
					element.usageFakeUsed.setHeight(0);
					element.usageFakeUsed.setPosition(element.getPosition().clone());
					element.usageFakeUsed.setPositionY(0);

					if (network.usageView) {
						element.usageAnimation.play();
					} else {
						element.usageAnimation.stop();
					}
				}
			}
		});
	},
	/* h, s, v (0 ~ 1) */
	getHSVColor: function (h, s, v) {
		var r, g, b, i, f, p, q, t;
		if (h && s === undefined && v === undefined) {
			s = h.s, v = h.v, h = h.h;
		}
		i = Math.floor(h * 6);
		f = h * 6 - i;
		p = v * (1 - s);
		q = v * (1 - f * s);
		t = v * (1 - (1 - f) * s);
		switch (i % 6) {
			case 0: r = v, g = t, b = p; break;
			case 1: r = q, g = v, b = p; break;
			case 2: r = p, g = v, b = t; break;
			case 3: r = p, g = q, b = v; break;
			case 4: r = t, g = p, b = v; break;
			case 5: r = v, g = p, b = q; break;
		}
		var rgb='#'+this.toHex(r * 255)+this.toHex(g * 255)+this.toHex(b * 255);
		return rgb;
	},

	toHex: function (value){
		var result=parseInt(value).toString(16);
		if(result.length==1){
			result='0'+result;
		}
		return result;
	},


	resetView: function(network) {
		// demo.resetCamera(network);

		//reset all racks. unload contents, close door.
		var loadedRacks = [];
		network.getDataBox().forEach(function(element) {
			if (element.getClient('type') === 'rack' && element.oldRack) {
				loadedRacks.push(element);
			}	 	
		});


		for (var i = 0; i < loadedRacks.length; i++) {
			//restore the old rack.
			var newRack = loadedRacks[i];
			var oldRack = newRack.oldRack;

			if (newRack.alarm) {
				network.getDataBox().getAlarmBox().remove(newRack.alarm);
			}
			network.getDataBox().removeByDescendant(newRack, true);

			network.getDataBox().add(oldRack);
			if (oldRack.alarm) {
				network.getDataBox().getAlarmBox().add(oldRack.alarm);
			}
			oldRack.door.setParent(oldRack);
			oldRack.setClient('loaded', false);

			//reset door.
			var door = oldRack.door;
			network.getDataBox().add(door);
			if (door.getClient('animated')) {
				demo.playAnimation(door, door.getClient('animation'));
			}
		}

		//reset room door.
		var doors = [];
		network.getDataBox().forEach(function(element) {
			if (element.getClient('type') === 'left-door' || element.getClient('type') === 'right-door') {
				doors.push(element);
			}
		});
		for (var i = 0; i < doors.length; i++) {
			var door = doors[i];
			if (door.getClient('animated')) {
				demo.playAnimation(door, door.getClient('animation'));
			}
		}

		if(network.usageView){
			demo.showRackHideAtemp();
			demo.toggleUsageView(network);
		}
	},

	setupControlBar: function(network) {
		var div = document.createElement('div');

		div.setAttribute('id', 'toolbar');
		div.style.display = 'block';
		div.style.position = 'absolute';
		div.style.left = '20px';
		div.style.top = '10px';
		div.style.width = 'auto';
		document.body.appendChild(div);
	},

	setupToolbar: function(buttons) {
		var count = buttons.length;
		var step = 32;

		var div = document.createElement('div');
		div.setAttribute('id', 'toolbar');
		div.style.display = 'block';
		div.style.position = 'absolute';
		div.style.left = '10px';
		div.style.top = '75px';
		div.style.width = '32px';
		div.style.height = (count * step + step) + 'px';
		div.style.background = 'rgba(255,255,255,0.75)';
		div.style['border-radius'] = '5px';
		document.body.appendChild(div);

		for (var i = 0; i < count; i++) {
			var button = buttons[i];
			var icon = button.icon;
			var img = document.createElement('img');
			img.style.position = 'absolute';
			img.style.left = '4px';
			img.style.top = (step / 2 + (i * step)) + 'px';
			img.style['pointer-events'] = 'auto';
			img.style['cursor'] = 'pointer';
			img.setAttribute('src', demo.getRes(icon));
			img.style.width = '24px';
			img.style.height = '24px';
			img.setAttribute('title', button.label);
			img.onclick = button.clickFunction;
			div.appendChild(img);
		}
	},	
	// 播放监控摄像头
	showDialog: function(content, title, width, height) {
		title= title || '';
		width=width || 600;
		height=height || 400;
		var div=document.getElementById('dialog');
		if(div){
			document.body.removeChild(div);
		}
		div=document.createElement('div');
		div.setAttribute('id', 'dialog');

		div.style.display = 'block';
		div.style.position = 'absolute';
		div.style.left = '100px';
		div.style.top = '100px';
		div.style.width=width+'px';
		div.style.height=height+'px';
		div.style.background='rgba(164,186,223,0.75)';						
		div.style['border-radius']='5px';
		document.body.appendChild(div);

		var span=document.createElement('span');
		span.style.display = 'block';
		span.style['color']='white';
		span.style['font-size']='13px';
		span.style.position = 'absolute';
		span.style.left = '10px';
		span.style.top = '2px';
		span.innerHTML=title;
		div.appendChild(span);

		var img=document.createElement('img');
		img.style.position = 'absolute';
		img.style.right= '4px';
		img.style.top = '4px';
		img.setAttribute('src', demo.getRes('close.png'));
		img.onclick = function () {
			document.body.removeChild(div);
		};
		div.appendChild(img);

		if(content){
			content.style.display = 'block';
			content.style.position = 'absolute';
			content.style.left = '3px';
			content.style.top = '24px';
			content.style.width=(width-6)+'px';
			content.style.height=(height-26)+'px';
			div.appendChild(content);
		}
	},
	showVideoDialog: function(title){
		var video=document.createElement('video');		
		video.setAttribute('src', demo.getRes('test.mp4'));
		video.setAttribute('controls', 'true');
		video.setAttribute('autoplay', 'true');			
		
		demo.showDialog(video, title, 610, 280);
	}
}
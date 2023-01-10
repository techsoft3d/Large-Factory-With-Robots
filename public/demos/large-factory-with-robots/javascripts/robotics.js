import createViewer from '/javascripts/common/create_viewer.js';

export default function robotViewer(language) {
    this._language = language;
    this._viewer;
    this._robotSystems = [];
    this.operatingRatio = {};
    this._markupHandle = "";
    this._markupId;
    this._ratios = [];
    this._resources = [];
    this._doneProcessIds = [];
    this._defaultAmbientLightColor;
    this._viewer2D;
    this._drawingOp;
    this._drawingOpHandle;
    this._cameraChangedFromDraw = false;
    this._socket;
    this._toolTipOp;
    this._screenConf;
    this._statusMarkUpArr = [];
    this._sharedCamera;
    this._isSharedCamera = true;
    this._controlLockOp;
    this._controlLockOpHandle;
    this._controlLockOp2D;
    this._controlLockOpHandle2D;
    this._customWalkOp;
    this._customWalkOpHandle;

    var ua = navigator.userAgent;
    if (ua.indexOf("iPhone") > 0 || ua.indexOf("iPod") > 0 || ua.indexOf("Android") > 0 && ua.indexOf("Mobile") > 0) {
        this._screenConf = Communicator.ScreenConfiguration.Mobile;
    } else if (ua.indexOf("iPad") > 0 || ua.indexOf("Android") > 0) {
        this._screenConf = Communicator.ScreenConfiguration.Mobile;
    } else {
        this._screenConf = Communicator.ScreenConfiguration.Desktop;
    }

    this._robotOffsetArr = [];
    this._robotOffsetArr.push({ a: 180, x: 29970, y: 10775, z: 458 });
    this._robotOffsetArr.push({ a: -90, x: 38800, y: 16460, z: 458 });
    this._robotOffsetArr.push({ a: 180, x: 70725, y: 11260, z: 92 });
    this._robotOffsetArr.push({ a: 0, x: 77900, y: 13640, z: 458 });

    this._robotOffsetArr.push({ a: -90, x: 22600, y: 47900, z: 92 });
    this._robotOffsetArr.push({ a: 180, x: 31100, y: 48400, z: 92 });
    this._robotOffsetArr.push({ a: 180, x: 37100, y: 48885, z: 92 });
    this._robotOffsetArr.push({ a: 135, x: 51773, y: 44859, z: 92 });
    this._robotOffsetArr.push({ a: -90, x: 55000, y: 48600, z: 92 });

    this._robotOffsetArr.push({ a: 0, x: 24000, y: 56300, z: 92 });
    this._robotOffsetArr.push({ a: 0, x: 29300, y: 57427, z: 92 });
    this._robotOffsetArr.push({ a: 0, x: 37747, y: 56682, z: 92 });
    this._robotOffsetArr.push({ a: 0, x: 52350, y: 57560, z: 92 });
    this._robotOffsetArr.push({ a: 45, x: 76500, y: 57900, z: 92 });

    this._robotOffsetArr.push({ a: -90, x: 93100, y: 16200, z: 92 });
    this._robotOffsetArr.push({ a: 180, x: 93600, y: 25900, z: 92 });
    this._robotOffsetArr.push({ a: -135, x: 94800, y: 34000, z: 92 });
    this._robotOffsetArr.push({ a: 0, x: 92800, y: 46300, z: 92 });

}

robotViewer.prototype.start = function (viewerMode, reverseProxy) {
    var _this = this;
    _this._initResources();
    _this._initDialog();
    _this._createViewer(viewerMode, reverseProxy, "latest");
    _this._initEvent();
}

robotViewer.prototype._initResources = function () {
    var _this = this;
    if (_this._language == "ja") {
        document.title = "工場コラボモニター";
        $("#title").html("&nbsp;工場コラボモニター");
        $("#demoInfo").html('このデモは、遠隔地にある工場からアップロードされる稼働状況をモニターリングします。<br>');
        _this._resources = ["設備稼働率", "1日あたりの時間", "アイドリング", "稼働", "停止", "アラーム", "電源断", "設備名", "工場稼働率", "現在の状況", "加工中のプログラム"];

    } else {
        _this._resources = ["Equipment operating ratio", "Hours per Day", "Idling", "Running", "Stopping", "Alarm", "Shut-down", "Equipment name", "Factory Operating Ratio", "Current status", "Processing program"];
    }

    if (_this._screenConf == Communicator.ScreenConfiguration.Mobile) {
        $("#demoInfo").hide();
        $("#triangleCount").hide();
        $("#viewerVersion").hide();
    }

};

robotViewer.prototype._initDialog = function () {
    var _this = this;
    $("#sample-dialog").dialog({
        annotation: undefined,
        viewer: undefined,
        autoOpen: false,
        width: 600,
        height: 400,
        modal: true,
        title: _this._resources[8],
        closeOnEscape: true,
        resizable: false,
        open: function (event, ui) {
            var w = 600;
            if (window.innerWidth < 600)
                w = window.innerWidth;
            $("#sample-dialog").dialog({ width: w });
            drawColumnChart(_this._ratios, w);
        }

    });

    function drawColumnChart(ratios, w) {
        var dataArr = [];
        dataArr.push([_this._resources[7], _this._resources[2], { role: 'style' }, _this._resources[3], { role: 'style' }, _this._resources[4], { role: 'style' }, _this._resources[5], { role: 'style' }, _this._resources[6], { role: 'style' }]);
        for (var i = 0; i < ratios.length; i++) {
            var ratio = ratios[i];
            dataArr.push([ratio.name,
            Number(ratio.ratio.idling), "#8080ff",
            Number(ratio.ratio.running), "80ff80",
            Number(ratio.ratio.stopping), "ffff80",
            Number(ratio.ratio.alarm), "ff8080",
            Number(ratio.ratio.shutdown), "808080"]);
        }
        var data = google.visualization.arrayToDataTable(dataArr);
        var options = {
            width: w - 50,
            height: 330,
            isStacked: true,
            series: {
                0: { color: "#8080ff", visibleInLegend: true },
                1: { color: "80ff80", visibleInLegend: true },
                2: { color: "ffff80", visibleInLegend: true },
                3: { color: "ff8080", visibleInLegend: true },
                4: { color: "808080", visibleInLegend: true },
            },
            chartArea: { left: 105, top: 50, width: '90%', height: '80%' },
            legend: { position: 'top', maxLines: 3 },
            vAxis: {
                minValue: 0
            }

        };
        var chart = new google.visualization.BarChart(document.getElementById("columnChart"));
        chart.draw(data, options);
    }
};

robotViewer.prototype._createViewer = function (viewerMode, reverseProxy, hwp_version) {
    var _this = this;
    createViewer("factory_floor", "container").then(function (hwv) {
        _this._viewer = hwv;
        _this._socket = io('/factory'); // namespace to /factory endpoint

        //setup sockets
        _this._socket.on('userConnectChange', function (numUsersConnected, sharedCamera) {
            $("#userCount").text('User count: ' + numUsersConnected);

            if (undefined != sharedCamera) {
                var camObj = JSON.parse(sharedCamera);
                _this._sharedCamera = Communicator.Camera.construct(camObj);
            }
        });

        _this._socket.on('cameraChange', function (camera) {
            var camObj = JSON.parse(camera);
            _this._sharedCamera = Communicator.Camera.construct(camObj);

            if (_this._isSharedCamera) {
                _this._viewer.unsetCallbacks({ camera: cameraFunc });
                _this._viewer.getView().setCamera(_this._sharedCamera);
                _this._viewer.setCallbacks({ camera: cameraFunc });
            }

            // Update camera markup on 2D Map
            // compute view direction
            var target = _this._sharedCamera.getTarget();
            var position = _this._sharedCamera.getPosition();
            var cameraDir = target.subtract(position);
            cameraDir.normalize();
            var angleDeg = vectorToXYPlaneAngleDeg(cameraDir);

            // create camera markups
            if (undefined != _this._drawingOp) {
                _this._drawingOp.createUpdateCameraMarkups(position, angleDeg, _this._isSharedCamera);
            }
        });

        _this._socket.on('selectionChange', function (selection) {
            _this._viewer.unsetCallbacks({ selection: selectionChanged });
            if (selection._nodeId != null) {
                _this._viewer.getSelectionManager().selectNode(selection._nodeId);
            }
            else {
                _this._viewer.getSelectionManager().clear();
            }
            _this._viewer.setCallbacks({ selection: selectionChanged });
        });

        _this._socket.on('toolTip', function (nodeId, position, info) {
            if (_this._isSharedCamera) {
                if (position != undefined) {
                    _this._viewer.model.setNodesHighlighted([nodeId], true);

                    var markupItem = new textBoxMarkup(_this._viewer, _this._resources, position, info);
                    _this._markupHandle = _this._viewer.markupManager.registerMarkup(markupItem);
                    _this._markupId = info.id;
                }
                else {
                    if (-1 != nodeId) {
                        _this._viewer.model.setNodesHighlighted([nodeId], false);
                    }

                    if (_this._markupHandle != "") {
                        _this._viewer.markupManager.unregisterMarkup(_this._markupHandle);
                        $("#piechart" + _this._markupId).hide();
                        _this._markupHandle = ""
                    }
                }
            }
        });

        _this._socket.on('controlLock', function (isOn) {
            _this._viewer.unsetCallbacks({ selection: selectionChanged });
            if (_this._isSharedCamera) {
                if (isOn) {
                    $("#userControl").text('User control is locked');
                    _this._controlLockOp.setHandled(true);
                    _this._controlLockOp2D.setHandled(true);

                }
                else {
                    $("#userControl").text('');
                    _this._controlLockOp.setHandled(false);
                    _this._controlLockOp2D.setHandled(false);
                }
            }
        });

        _this._socket.on('updateRobots', function (robotStatusArr) {
            if (robotStatusArr.length <= _this._robotSystems.length && robotStatusArr.length <= _this._statusMarkUpArr.length) {
                _this._viewer.model.resetNodesColor();

                for (var i = 0; i < robotStatusArr.length; i++) {
                    var robotStatus = robotStatusArr[i];

                    _this._robotSystems[i].status = robotStatus.status;

                    switch (robotStatus.status) {
                        case "IDLE": {
                            _this._robotSystems[i].reset(robotStatus.matArr);
                            _this._statusMarkUpArr[i].setColor(new Communicator.Color(0, 0, 0));
                        }
                            break;

                        case "RUN": {
                            _this._robotSystems[i].moveRobot(robotStatus.matArr, robotStatus.ONum);
                            _this._statusMarkUpArr[i].setColor(new Communicator.Color(0, 255, 0));
                        }
                            break;

                        case "STOP": {
                            if (!_this._robotSystems[i].isStatusUpdated) {
                                _this._robotSystems[i].moveRobot(robotStatus.matArr, robotStatus.ONum);
                            }
                            _this._robotSystems[i].stop();
                            _this._statusMarkUpArr[i].setColor(new Communicator.Color(255, 255, 0));
                            _this._statusMarkUpArr[i].blinkMarkup();
                        }
                            break;

                        case "ALARM": {
                            if (!_this._robotSystems[i].isStatusUpdated) {
                                _this._robotSystems[i].moveRobot(robotStatus.matArr, robotStatus.ONum);
                            }
                            _this._robotSystems[i].alarm(robotStatus.alermReason);
                            _this._statusMarkUpArr[i].setColor(new Communicator.Color(255, 0, 0));
                            _this._statusMarkUpArr[i].blinkMarkup();
                        }
                            break;

                        case "SHUT_DOWN": {
                            _this._robotSystems[i].shutdown();
                            _this._statusMarkUpArr[i].setColor(new Communicator.Color(128, 128, 128));
                        }
                            break;

                    }
                    
                    _this._robotSystems[i].isStatusUpdated = true;
                }

                _this._viewer2D.markupManager.refreshMarkup();

            }
        });

        _this._socket.on('viewCreated', function (markupView) {
            if (!_this._isSharedCamera)
                retur;

            var markupViewObj = JSON.parse(markupView);
            _this._viewer.unsetCallbacks({ viewCreated: viewCreated });
            _this._viewer.markupManager.loadMarkupData({ views: [markupViewObj] }).then(function (ret) {
                _this._viewer.markupManager.activateMarkupView(markupViewObj.uniqueId);
                _this._viewer.markupManager.refreshMarkup();
                _this._viewer.setCallbacks({ viewCreated: viewCreated });
            });
        });

        _this._socket.on('handleRedline', function (redlineItem, className, updateExisting) {
            if (!_this._isSharedCamera)
                retur;

            var markupObj = JSON.parse(redlineItem);
            _this._viewer.unsetCallbacks({ redlineCreated: newRedlineCallback, });

            var markupClass = ClassForString(className);
            if (markupClass) {
                var newMarkup = markupClass.construct(markupObj, _this._viewer);
                if (newMarkup) {
                    if (updateExisting) {
                        let ind = -1;
                        let markupItems = _this._viewer.markupManager.getActiveMarkupView().getMarkup();
                        for (let i = 0; i < markupItems.length; i++) {
                            // Access private variable directly cause markup serialization is buggy AF
                            if (markupItems[i]._uniqueId === newMarkup._uniqueId) {
                                ind = i;
                                break;
                            }
                        }
                        _this._viewer.markupManager.getActiveMarkupView().removeMarkup(markupItems[ind]);
                    }
                    _this._viewer.markupManager.getActiveMarkupView().addMarkupItem(newMarkup);
                    _this._viewer.markupManager.refreshMarkup();
                }
            }
            _this._viewer.setCallbacks({ redlineCreated: newRedlineCallback, });
        });

        function ClassForString(className) {// helper function for creating redline programaticlly
            var arr = className.split(".");
            var fn = window || this;
            for (var i = 0, len = arr.length; i < len; i++) {
                fn = fn[arr[i]];
            }

            if (typeof fn !== "function") {
                return null;
            }
            return fn;
        }

        function createFloorMap() {
            if (_this._screenConf == Communicator.ScreenConfiguration.Mobile) {
                $('#container2D').height(150).width(200);
            }

            createViewer("floor_map", "container2D",).then(function (hwv) {
                _this._viewer2D = hwv;

                _this._viewer2D.setCallbacks({
                    sceneReady: function () {
                        var cameraString = '{"position":{"x":14953.727588117312,"y":23882.347588947476,"z":226514.8907474594},"target":{"x":14953.727588117312,"y":23882.347588947476,"z":5434.78662109375},"up":{"x":0,"y":1,"z":0},"width":221080.10412636565,"height":221080.10412636565,"projection":0,"nearLimit":0.01,"className":"Communicator.Camera"}'
                        var json = JSON.parse(cameraString);
                        var camera = new Communicator.Camera.construct(json);
                        _this._viewer2D.view.setCamera(camera);

                        var camera3D = _this._viewer.view.getCamera();
                        _this._viewer.view.setCamera(camera3D);

                        // assign panning to mouse right cutton
                        var operatorId = Communicator.OperatorId.Pan;
                        var operator = _this._viewer2D.operatorManager.getOperator(operatorId);
                        operator.setMapping(Communicator.Button.Left);

                        // create status markups
                        for (var i = 0; i < 18; i++) {
                            var pos = new Communicator.Point3(_this._robotOffsetArr[i].x, _this._robotOffsetArr[i].y, _this._robotOffsetArr[i].z)
                            var markupItem = new statusMarkup(_this._viewer2D, pos);
                            _this._statusMarkUpArr.push(markupItem);

                            _this._viewer2D.markupManager.registerMarkup(_this._statusMarkUpArr[i]);
                        }
                    },
                    modelStructureReady: function () {
                    },
                });

                _this._drawingOp = new drawingOperator(_this._viewer2D, _this);
                _this._drawingOpHandle = _this._viewer2D.registerCustomOperator(_this._drawingOp);

                _this._controlLockOp2D = new controlLockOperator(_this._socket);
                _this._controlLockOpHandle2D = _this._viewer2D.registerCustomOperator(_this._controlLockOp2D);

                _this._viewer2D.setClientTimeout(60, 59);

                _this._viewer2D.start();

                // Set operators
                _this._viewer2D.operatorManager.clear();
                _this._viewer2D.operatorManager.push(Communicator.OperatorId.Zoom);
                _this._viewer2D.operatorManager.push(Communicator.OperatorId.Pan);
                _this._viewer2D.operatorManager.push(_this._drawingOpHandle);
                _this._viewer2D.operatorManager.push(_this._controlLockOpHandle2D);

            });
        }

        function sceneReadyFunc() {
            // Set background color
            _this._viewer.view.setBackgroundColor(new Communicator.Color(255, 255, 255), new Communicator.Color(192, 192, 192));

            // Set selection disable
            _this._viewer.getSelectionManager().setHighlightFaceElementSelection(false);
            _this._viewer.getSelectionManager().setHighlightLineElementSelection(false);

            _this._viewer.getSelectionManager().setNodeSelectionColor(new Communicator.Color(128, 255, 255));

            // View
            // Set camera
            _this._viewer.view.setCamera(_this._sharedCamera);

            _this._viewer.view.setDrawMode(Communicator.DrawMode.Shaded);

            _this._viewer.view.setBackfacesVisible(true);

            // Framerate
            _this._viewer.setMinimumFramerate(8);

            // Set rendering effort
            _this._defaultAmbientLightColor = _this._viewer.view.getAmbientLightColor();
            _this._viewer.view.setAmbientLightColor(new Communicator.Color(128, 128, 128));

            _this._viewer.view.setAmbientOcclusionEnabled(true);

            _this._viewer.view.getAxisTriad().enable();
            _this._viewer.view.getAxisTriad().setAnchor(Communicator.OverlayAnchor.UpperRightCorner);
        }

        function modelStructureReadyFunc() {
            // Create floor map
            createFloorMap();

            _this._viewer.pauseRendering();
            var model = _this._viewer.model;
            _this._createRobotSystem("#1-1 Arc Welding", "WeldRobot1", 7, _this._robotOffsetArr[0]).then(function () {
                return _this._createRobotSystem("#1-2 Arc Welding", "WeldRobot1", 7, _this._robotOffsetArr[1]);
            }).then(function () {
                return _this._createRobotSystem("#1-3 Arc Welding", "WeldRobot1", 7, _this._robotOffsetArr[2]);
            }).then(function () {
                return _this._createRobotSystem("#1-4 Pick&Place", "PickUpRobot1", 13, _this._robotOffsetArr[3]);
            }).then(function () {
                return _this._createRobotSystem("#2-2 Spot Welding", "NsRobot5", 8, _this._robotOffsetArr[4]);
            }).then(function () {
                return _this._createRobotSystem("#1-5 CMM", "CMM_Assy", 6, _this._robotOffsetArr[5]);
            }).then(function () {
                return _this._createRobotSystem("#1-6 Pick&Place", "PickUpRobot1", 13, _this._robotOffsetArr[6]);
            }).then(function () {
                return _this._createRobotSystem("#1-7 Pick&Place", "PickUpRobot1", 13, _this._robotOffsetArr[7]);
            }).then(function () {
                return _this._createRobotSystem("#1-8 Pick&Place", "PickUpRobot1", 13, _this._robotOffsetArr[8]);
            }).then(function () {
                return _this._createRobotSystem("#2-1 CMM", "CMM_Assy", 6, _this._robotOffsetArr[9]);
            }).then(function () {
                return _this._createRobotSystem("#2-2 Spot Welding", "NsRobot5", 8, _this._robotOffsetArr[10]);
            }).then(function () {
                return _this._createRobotSystem("#2-3 Pick&Place", "PickUpRobot1", 13, _this._robotOffsetArr[11]);
            }).then(function () {
                return _this._createRobotSystem("#2-4 Spot Welding", "NsRobot5", 8, _this._robotOffsetArr[12]);
            }).then(function () {
                return _this._createRobotSystem("#2-5 Arc Welding", "WeldRobot1", 7, _this._robotOffsetArr[13]);
            }).then(function () {
                return _this._createRobotSystem("#2-6 Spot Welding", "NsRobot5", 8, _this._robotOffsetArr[14]);
            }).then(function () {
                return _this._createRobotSystem("#2-7 CMM", "CMM_Assy", 6, _this._robotOffsetArr[15]);
            }).then(function () {
                return _this._createRobotSystem("#2-8 Arc Welding", "WeldRobot1", 7, _this._robotOffsetArr[16]);
            }).then(function () {
                return _this._createRobotSystem("#3-1 Arc Welding", "WeldRobot1", 7, _this._robotOffsetArr[17]);
            }).then(function () {
                _this._viewer.resumeRendering();

                // Set Walk operator
                _this._viewer.operatorManager.set(_this._customWalkOpHandle, 0);

                // Set robot node as AlwaysDraw
                var nodes = [];
                _this._robotSystems.forEach(function (robot) {
                    nodes.push(robot.robotRootId);
                });

                _this._viewer.model.setInstanceModifier(Communicator.InstanceModifier.AlwaysDraw, nodes, true);

                // Chart
                function drawChart(ratio, divId) {
                    var data = google.visualization.arrayToDataTable([
                        [_this._resources[0], _this._resources[1]],
                        [_this._resources[2], Number(ratio.idling)],
                        [_this._resources[3], Number(ratio.running)],
                        [_this._resources[4], Number(ratio.stopping)],
                        [_this._resources[5], Number(ratio.alarm)],
                        [_this._resources[6], Number(ratio.shutdown)]
                    ]);

                    var options = {
                        title: _this._resources[0],
                        chartArea: { left: 10, top: 15, width: '100%', height: '100%' },
                        is3D: true,
                        backgroundColor: "#ffffc6",
                        colors: ["#8080ff", "80ff80", "ffff80", "ff8080", "808080"],
                        pieSliceTextStyle: { color: "000000" }
                    };

                    var chart = new google.visualization.PieChart(document.getElementById(divId));
                    chart.draw(data, options);
                }

                $.getJSON("/demos/large-factory-with-robots/jsons/operating_ratio.json", function (ratioData) {
                    if (ratioData) {
                        _this._ratios = [];
                        for (var i = 0; i < _this._robotSystems.length; i++) {
                            var obj = ratioData[_this._robotSystems[i].instanceName];
                            if (obj != undefined) {
                                var ratio = obj[0].operating_ratio;
                                drawChart(ratio, "piechart" + i)
                                $("#piechart" + i).hide();
                                var o = { name: _this._robotSystems[i].instanceName, ratio: ratio }
                                _this._ratios.push(o);
                            }
                        }
                    }
                });

                // load factory
                var root = _this._viewer.model.getRootNode();
                var nodeId = model.createNode(root, "factory");
                // const startTime = performance.now();
                model.loadSubtreeFromModel(nodeId, "Factory_Without_Moving_Robots_Op2").then(function () {
                    // const endTime = performance.now();
                    // console.log('Model loading time: ' + (endTime - startTime));
                });
            });
        }

        function selectionFunc(event) {
            if (_this._markupHandle != "") {
                _this._viewer.markupManager.unregisterMarkup(_this._markupHandle);
                $("#piechart" + _this._markupId).hide();
                _this._markupHandle = ""
            }

            _this._viewer.operatorManager.push(toolTipHandle);

            if (event.getType() != Communicator.SelectionType.None) {
                var selectionItem = event.getSelection();
                var nodeId = selectionItem.getNodeId();
                for (var i = 0; i < 3; i++)
                    nodeId = _this._viewer.model.getNodeParent(nodeId);
                var selTip = new toolTipOperator(_this._viewer, _this._robotSystems, _this._resources);
                var info = selTip._getRobotInfo(nodeId);
                if (info != undefined) {
                    var position = selectionItem.getPosition();
                    if (position) {
                        if (_this._toolTipOp != undefined) {
                            var obj = _this._toolTipOp.getMarkupHandle();
                            _this._markupHandle = obj.handle;
                            _this._markupId = obj.id;
                            _this._viewer.operatorManager.pop();
                        }
                        if (_this._markupHandle == "") {
                            var markupItem = new textBoxMarkup(_this._viewer, _this._resources, position, info);
                            _this._markupHandle = _this._viewer.markupManager.registerMarkup(markupItem);
                            _this._markupId = info.id;
                        }
                    }
                    _this._viewer.model.setNodesHighlighted([nodeId], true);
                }
            }
        }

        function frameDrawnFunc() {
            _this._viewer.getStatistics().then(function (obj) {
                $("#triangleCount").html("Triangle count: " + obj.triangle_count);
            });
        }

        function cameraFunc(camera) {
            if (!_this._cameraChangedFromDraw) {
                var position = camera.getPosition();
                var target = camera.getTarget();

                // compute view direction
                var cameraDir = target.subtract(position);
                cameraDir.normalize();
                var angleDeg = vectorToXYPlaneAngleDeg(cameraDir);

                // create camera markups
                if (undefined != _this._drawingOp) {
                    _this._drawingOp.createUpdateCameraMarkups(position, angleDeg);
                }

            }

            if (_this._isSharedCamera) {
                _this._socket.emit('cameraChange', JSON.stringify(camera.forJson()));
                _this._sharedCamera = camera;
            }
        }

        function selectionChanged(selection) {
            _this._socket.emit('selectionChange', selection.getSelection());
        }

        function viewCreated(view) {
            if (_this._isSharedCamera) {
                if (view.getMarkup().length >= 1) {
                    _this._socket.emit('viewCreated', JSON.stringify(view.forJson()));
                }
            }
        }

        function newRedlineCallback(redlineItem) {
            if (_this._isSharedCamera) {
                var view = _this._viewer.markupManager.getActiveMarkupView();
                if (view.getMarkup().length > 1) {
                    var className = redlineItem.getClassName();
                    _this._socket.emit('handleRedline', JSON.stringify(redlineItem.toJson()), className, false);
                }
            }
        }

        function redlineUpdated(redlineItem) {
            if (_this._isSharedCamera) {
                var className = redlineItem.getClassName();
                _this._socket.emit('handleRedline', JSON.stringify(redlineItem.toJson()), className, true);
            }
        }

        function disableRedlineTracking(view) {
            var basefunc = Communicator.Markup.MarkupView.prototype.addMarkupItem;
            view.addMarkupItem = function (markupItem) {
                basefunc.call(view, markupItem);
            }
        }

        _this._viewer.setCallbacks({
            sceneReady: sceneReadyFunc,
            modelStructureReady: modelStructureReadyFunc,
            selection: selectionFunc,
            frameDrawn: frameDrawnFunc,
            camera: cameraFunc,
            selection: selectionChanged,
            viewCreated: viewCreated,
            redlineCreated: newRedlineCallback,
            redlineUpdated: redlineUpdated
        });

        // register custom operator
        _this._toolTipOp = new toolTipOperator(_this._viewer, _this._robotSystems, _this._resources, _this._socket);
        var toolTipOpHandle = _this._viewer.registerCustomOperator(_this._toolTipOp);

        _this._controlLockOp = new controlLockOperator(_this._socket);
        _this._controlLockOpHandle = _this._viewer.registerCustomOperator(_this._controlLockOp);

        _this._customWalkOp = new customWalkOperator(_this._viewer);
        _this._customWalkOpHandle = _this._viewer.registerCustomOperator(_this._customWalkOp);

        _this._viewer.start();
        _this._viewer.operatorManager.push(toolTipOpHandle);
        _this._viewer.operatorManager.push(_this._controlLockOpHandle);

        _this._viewer.setClientTimeout(60, 59);

        // Viewer virsion
        var ver = _this._viewer.getViewerVersionString();
        $("#viewerVersion").html("Viewer version: " + ver);

    });
};

robotViewer.prototype._initEvent = function () {
    var _this = this;

    var resizeTimer;
    var interval = Math.floor(1000 / 60 * 10);
    $(window).resize(function () {
        if (resizeTimer !== false) {
            clearTimeout(resizeTimer);
        }
        resizeTimer = setTimeout(function () {
            layoutPage()
            _this._viewer.resizeCanvas();
        }, interval);
    });

    layoutPage();

    function layoutPage() {
        $("#content")
            .offset({ top: 82 })
            .height(window.innerHeight - 83);
        $("#footer").offset({
            top: window.innerHeight - 20
        });
    }

    $('.settingChk').on("change", function () {
        var command = $(this).data("command");
        var chk = $(this).is(':checked');

        switch (command) {
            case 'ambientOcclusion': {
                if (chk) {
                    _this._viewer.view.setAmbientLightColor(new Communicator.Color(128, 128, 128));

                    _this._viewer.view.setAmbientOcclusionEnabled(true);

                } else {
                    _this._viewer.view.setAmbientLightColor(_this._defaultAmbientLightColor);
                    _this._viewer.view.setAmbientOcclusionEnabled(false);
                }
                $('.toolbarBtn[data-command="settings"]').data("on", false).css("background-color", "white");
                $('#settingsPanel').hide();
            }
                break;
        }
    });

    $('.toolbarBtn').on({
        "click": function () {
            function resetCommand(command) {
                $('.toolbarBtn[data-command="' + command + '"]').data("on", false).css("background-color", "white");
            }

            var command = $(this).data("command");

            if ($('.toolbarBtn[data-command="settings"]').data("on")) {
                $('#settingsPanel').hide();
                resetCommand('settings');
                if (command == 'settings') {
                    return;
                }
            }

            switch (command) {
                case 'home': {
                    // Set default camera
                    var json = JSON.parse('{"position":{"x":17659.919348039737,"y":52362.37644771221,"z":1352.0856142151429},"target":{"x":27555.80822332009,"y":51834.791296864605,"z":314.14414225844394},"up":{"x":0.10401986316290744,"y":-0.005545670115095642,"z":0.9945597586925305},"width":9964.149755794933,"height":9964.149755794933,"projection":1,"nearLimit":0.01,"className":"Communicator.Camera"}');
                    var camera = new Communicator.Camera.construct(json);
                    _this._viewer.view.setCamera(camera);
                }
                    break;

                case 'collabo': {
                    var wasOn = $(this).data("on");
                    if (wasOn) {
                        _this._isSharedCamera = false;
                        _this._drawingOp.changeShared(_this._isSharedCamera);
                        _this._drawingOp.createUpdateCameraMarkups();

                        _this._toolTipOp.setIsShared(false);

                        _this._viewer.operatorManager.remove(_this._controlLockOpHandle);
                        _this._viewer2D.operatorManager.remove(_this._controlLockOpHandle2D);

                        $(this).data("on", false).css("background-color", "white");
                    }
                    else {
                        _this._viewer.getView().setCamera(_this._sharedCamera);

                        _this._isSharedCamera = true;
                        _this._drawingOp.changeShared(_this._isSharedCamera);

                        _this._toolTipOp.setIsShared(true);

                        _this._viewer.operatorManager.push(_this._controlLockOpHandle);
                        _this._viewer2D.operatorManager.push(_this._controlLockOpHandle2D);

                        $(this).data("on", true).css("background-color", "tomato");
                    }
                }
                    break;

                case 'redline': {
                    var wasOn = $(this).data("on");
                    if (wasOn) {
                        _this._viewer.operatorManager.remove(Communicator.OperatorId.RedlinePolyline);
                        $(this).data("on", false).css("background-color", "white");
                    }
                    else {
                        if (-1 != _this._viewer.operatorManager.indexOf(_this._controlLockOpHandle)) {
                            _this._viewer.operatorManager.remove(_this._controlLockOpHandle);
                            _this._viewer.operatorManager.push(Communicator.OperatorId.RedlinePolyline);
                            _this._viewer.operatorManager.push(_this._controlLockOpHandle);
                        }
                        else {
                            _this._viewer.operatorManager.push(Communicator.OperatorId.RedlinePolyline);
                        }
                        $(this).data("on", true).css("background-color", "tomato");
                    }
                }
                    break;

                case 'ratio': {
                    $("#sample-dialog").dialog("open");
                }
                    break;

                case 'settings': {
                    var off = $(this).offset();
                    $('#settingsPanel').offset({ left: off.left });
                    $('#settingsPanel').show();
                    $(this).data("on", true).css("background-color", "tomato");
                }
                    break;
            }
        },
        "touchstart mousedown": function () {
            $(this).css("background-color", "tomato");
        },
        "touchend mouseup": function () {
            $(this).css("background-color", "white");
        }
    });
};

robotViewer.prototype._createRobotSystem = function (instanceName, robotName, targetCnt, offset) {
    var _this = this;
    return new Promise(function (resolve, reject) {
        var model = _this._viewer.model;
        var root = model.getRootNode();
        var nodeName = "robot_system_" + _this._robotSystems.length;
        var nodeId = model.createNode(root, nodeName);
        model.loadSubtreeFromModel(nodeId, robotName).then(function () {
            var robotSystem = new robotInstance(_this._viewer, instanceName, robotName, _this._robotSystems.length, targetCnt, offset, nodeId);
            robotSystem.init(nodeId, offset);
            _this._robotSystems.push(robotSystem);
            resolve();
        });
    });
};

robotViewer.prototype._loadOperatingRatio = function () {
    var _this = this;
    return new Promise(function (resolve, reject) {

    });
};

robotViewer.prototype._restartProcess = function () {
    var _this = this;

    var intId = setInterval(function () {
        if (0 < _this._doneProcessIds.length) {
            var arr = _this._doneProcessIds.concat();
            _this._doneProcessIds.length = 0;

            var status = {};
            for (var i = 0; i < arr.length; i++) {
                status[arr[i]] = {
                    status: "run",
                    ONum: ('0000' + Math.floor(Math.random() * 10000)).slice(-4)
                }
            }

            _this._starusChange(status);
            _this._socket.emit('statusChange', status);
        }
    }, 2000);
};

robotViewer.prototype.processDone = function (id) {
    var _this = this;
    // console.log(id);
    _this._doneProcessIds.push(id);
};

robotViewer.prototype.translate3dCamera = function (drawingPoint, setback, positionZ) {
    var _this = this;

    // get current camera
    var camera = _this._viewer.view.getCamera();
    var position = camera.getPosition();
    var target = camera.getTarget();

    if (undefined == setback) {
        setback = 0;
    }
    var setbackVector = Communicator.Point3.subtract(target, position);
    setbackVector.normalize();

    // new camera position
    var newPosition = new Communicator.Point3(
        drawingPoint.x - setbackVector.x * setback,
        drawingPoint.y - setbackVector.y * setback,
        position.z
    );

    if (undefined != positionZ) {
        newPosition.z = positionZ;
    }

    // camera target
    var newTarget = Communicator.Point3.add(newPosition, target.subtract(position));

    // set camera
    camera.setPosition(newPosition);
    camera.setTarget(newTarget);

    _this._viewer.view.setCamera(camera, 100);

    return true;
};

robotViewer.prototype.rotate3dCamera = function (rotateAngle) {
    var _this = this;

    // get current camera
    var camera = _this._viewer.view.getCamera();
    var position = camera.getPosition();
    var target = camera.getTarget();
    var up = camera.getUp();

    // rotate matrix
    var vZ = new Communicator.Point3(0, 0, 1);
    var matrixR = new Communicator.Matrix.createFromOffAxisRotation(vZ, rotateAngle);

    // rotate target
    var originToTarget = new Communicator.Point3.subtract(target, position);
    var newTarget = Communicator.Point3.zero();
    matrixR.transform(originToTarget, newTarget);
    newTarget.add(position);

    // rotate up
    var newUp = Communicator.Point3.zero();
    matrixR.transform(up, newUp);

    // set camera
    camera.setTarget(newTarget);
    camera.setUp(newUp);

    _this._viewer.view.setCamera(camera, 0);

    return true;
};


robotViewer.prototype._starusChange = function (status) {
    var _this = this;

    var model = _this._viewer.model;
    model.resetNodesColor();
    for (var i = 0; i < _this._robotSystems.length; i++) {
        if (status[String(i)]) {
            var obj = status[String(i)];
            var currentStatus = _this._robotSystems[i].status;
            if (obj.status == "run" && currentStatus != "run") {
                _this._robotSystems[i].startAnimation(obj.ONum);
            } else if (obj.status == "stop" && currentStatus == "run") {
                _this._robotSystems[i].status = "stop"
            } else if (obj.status == "alarm") {
                _this._robotSystems[i].alarm(obj.reason);
            } else if (obj.status == "reset") {
                _this._robotSystems[i].reset();
            } else if (obj.status == "shutdown") {
                _this._robotSystems[i].shutdown();
            }
        }
        switch (_this._robotSystems[i].status) {
            case "stop":
                model.setNodesFaceColor([_this._robotSystems[i].robotRootId], new Communicator.Color(255, 255, 0));
                break;
            case "alarm":
                model.setNodesFaceColor([_this._robotSystems[i].robotRootId], new Communicator.Color(255, 0, 0));
                break;
            case "shutdown":
                model.setNodesFaceColor([_this._robotSystems[i].robotRootId], new Communicator.Color(128, 128, 128));
                break;
        }
    }
};

class controlLockOperator {
    constructor(socket) {
        this._socket = socket;
        this._handled = false;
    }

    _onStart(event) {
        var _this = this;
        if (_this._handled) {
            event.setHandled(true);
            return;
        }
        _this._socket.emit('controlLock', true);
    }

    onMouseDown(event) {
        var _this = this;
        _this._onStart(event);
    }

    onTouchStart(event) {
        var _this = this;
        _this._onStart(event);
    }

    _onEnd(event) {
        var _this = this;
        if (_this._handled) {
            event.setHandled(true);
            return;
        }
        _this._socket.emit('controlLock', false);
    }

    onMouseUp(event) {
        var _this = this;
        _this._onEnd(event);
    }

    onTouchEnd(event) {
        var _this = this;
        _this._onEnd(event);
    }

    _onMove(event) {
        var _this = this;
        if (_this._handled) {
            event.setHandled(true);
            return;
        }
    }

    onMouseMove(event) {
        var _this = this;
        _this._onMove(event);
    }

    onTouchMove(event) {
        var _this = this;
        _this._onMove(event);
    }

    onMousewheel(event) {
        var _this = this;
        if (_this._handled) {
            event.setHandled(true);
            return;
        }
    }

    setHandled(handled) {
        var _this = this;
        _this._handled = handled;
    }
}
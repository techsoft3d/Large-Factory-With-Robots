function robotInstance(viewer, instanceName, robotName, id, targetCnt, offset, nodeId) {
    this._viewer = viewer;
    this.instanceName = instanceName;
    this._robotName = robotName;
    this._instanceId = id;
    this.status = "IDLE";
    this.ONum = ";"
    this.alermReason = "";
    this.robotRootId;
    this._targetCnt = targetCnt;
    this._matrixes = [];
    this._robotParts = [];
    this._nodeMatrixes = [];
    this._alarmId = 0;
    this.isStatusUpdated = false;
}

robotInstance.prototype.init = function (parentNode, offset) {
    var _this = this;
    _this._findNodeIds(parentNode, offset);
    for (var i = 0; i < _this._targetCnt; i++) {
        _this._nodeMatrixes.push(_this._viewer.model.getNodeMatrix(_this._robotParts[i]));
    }

};


robotInstance.prototype._findNodeIds = function (parentNode, offset) {
    var _this = this;
    var model = _this._viewer.model;
    var nodes = [];
    findNodeIdsFromName(parentNode, model, _this._robotName, nodes);
    if (nodes.length) {
        _this.robotRootId = nodes[0]
        if (offset != undefined) {
            var nodeMatrix = _this._viewer.model.getNodeMatrix(_this.robotRootId);

            var rotatMatrix = new Communicator.Matrix();
            if (offset.a != undefined) {
                rotatMatrix = new Communicator.Matrix.createFromOffAxisRotation(new Communicator.Point3(0, 0, 1), offset.a);
            }

            nodeMatrix = Communicator.Matrix.multiply(nodeMatrix, rotatMatrix)

            var transMatrix = new Communicator.Matrix()
            transMatrix.setTranslationComponent(offset.x, offset.y, offset.z);

            model.setNodeMatrix(_this.robotRootId, Communicator.Matrix.multiply(nodeMatrix, transMatrix));
        }

        var children = model.getNodeChildren(_this.robotRootId, true);
        _this._robotParts = model.getNodeChildren(children[0], true);
        _this._robotParts.shift();

    }
};

robotInstance.prototype.reset = function (matArr) {
    var _this = this;

    for (var i = 0; i < _this._targetCnt; i++) {
        var matrix = new Communicator.Matrix.createFromArray(matArr[i]);
        _this._viewer.model.setNodeMatrix(_this._robotParts[i], Communicator.Matrix.multiply(matrix, _this._nodeMatrixes[i]));
    }
    _this.ONum = "";
    _this.alermReason = "";
};

robotInstance.prototype.moveRobot = function (matArr, ONum) {
    var _this = this;

    _this.ONum = ONum;

    for (var i = 0; i < _this._targetCnt; i++) {
        var matrix = new Communicator.Matrix.createFromArray(matArr[i]);
        _this._viewer.model.setNodeMatrix(_this._robotParts[i], Communicator.Matrix.multiply(matrix, _this._nodeMatrixes[i]));
    }
}

robotInstance.prototype.stop = function () {
    var _this = this;

    _this._viewer.model.setNodesFaceColor([_this.robotRootId], new Communicator.Color(255, 255, 0));
}

robotInstance.prototype.alarm = function (reason) {
    var _this = this;

    _this.alermReason = reason;
    _this._viewer.model.setNodesFaceColor([_this.robotRootId], new Communicator.Color(255, 0, 0));
};

robotInstance.prototype.shutdown = function () {
    var _this = this;

    for (var i = 0; i < _this._targetCnt; i++) {
        _this._viewer.model.setNodeMatrix(_this._robotParts[i], _this._nodeMatrixes[i]);
    }
    _this.ONum = "";
    _this.alermReason = "";

    _this._viewer.model.setNodesFaceColor([_this.robotRootId], new Communicator.Color(128, 128, 128));
};
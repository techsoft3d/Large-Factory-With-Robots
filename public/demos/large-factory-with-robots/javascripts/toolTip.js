class toolTipOperator {
    constructor(viewer, robotSystems, resources, socket) {
        this._viewer = viewer;
        this._robotSystems = robotSystems;
        this._resources = resources;
        this._currentNode = -1;
        this._markupHandle = "";
        this._robotId;
        this._socket = socket;
        this._isSharedCamera = true;
        this._hovertimeout = null;

    }

    onMouseMove(event) {
        var _this = this;
        clearTimeout(_this._hovertimeout);
        _this._hovertimeout = null;
        if (event.getButton() == Communicator.Button.None) {
            _this._hovertimeout = setTimeout(function () {

                var pickConfig = new Communicator.PickConfig(Communicator.SelectionMask.Face);
                _this._viewer.view.pickFromPoint(event.getPosition(), pickConfig).then(function (selectionItem) {
                    var nodeId = selectionItem.getNodeId();
                    if (nodeId > 0) {
                        var parentId = nodeId;
                        for (var i = 0; i < 3; i++)
                            parentId = _this._viewer.model.getNodeParent(parentId);
                        if (parentId != _this._currentNode) {
                            _this._hideMarkup();
                            var info = _this._getRobotInfo(parentId);
                            if (info != undefined) {
                                var selectionPosition = selectionItem.getPosition();
                                if (selectionPosition) {
                                    var markupItem = new textBoxMarkup(_this._viewer, _this._resources, selectionPosition, info);
                                    _this._markupHandle = _this._viewer.markupManager.registerMarkup(markupItem);

                                    if (_this._isSharedCamera) {
                                        _this._socket.emit('toolTip', parentId, selectionPosition, info);
                                    }
                                }
                                if (-1 != _this._currentNode)
                                    _this._viewer.model.setNodesHighlighted([_this._currentNode], false);
                                _this._viewer.model.setNodesHighlighted([parentId], true);
                                _this._currentNode = parentId;
                            }
                        }
                    } else {
                        _this._hideMarkup();

                    }

                });
                _this._hovertimeout = null;
            }, 350);
        }
    }

    onDeactivate() {
        this._markupHandle = "";
    };

    getMarkupHandle() {
        var _this = this;
        return {handle: _this._markupHandle, id: _this._robotId};
    };

    _hideMarkup() {
        var _this = this;
        if (_this._markupHandle != "") {
            var MM = _this._viewer.markupManager;
            _this._viewer.markupManager.unregisterMarkup(_this._markupHandle);
            $("#piechart" + _this._robotId).hide();
            if (_this._isSharedCamera) {
                _this._socket.emit('toolTip', _this._currentNode, undefined, undefined);
            }
        }
        if (-1 != _this._currentNode) {
            _this._viewer.model.setNodesHighlighted([_this._currentNode], false);
            _this._currentNode = -1;
        }
        
    };

    _getRobotInfo(nodeId) {
        var _this = this;
        for (var i = 0; i < _this._robotSystems.length; i++) {
            if (_this._robotSystems[i].robotRootId == nodeId) {
                _this._robotId = i;
                return {
                    id: i,
                    instanceName: _this._robotSystems[i].instanceName,
                    status: _this._robotSystems[i].status,
                    ONum: _this._robotSystems[i].ONum,
                    reason: _this._robotSystems[i].alermReason
                    };
            }
        }
    };

    setIsShared(isShared) {
        var _this = this;

        _this._isSharedCamera = isShared;
    }
}

function textBoxMarkup(viewer, resources, point, info) {
    var _this = this;
    this._resources = resources;
    this._statusRes = {IDLE: this._resources[2], RUN: this._resources[3], STOP: this._resources[4], ALARM: this._resources[5], SHUT_DOWN: this._resources[6]};
    this._viewer = viewer;
    this._frame = new Communicator.Markup.Shape.Rectangle();
    this._frame.setFillOpacity(1);
    this._frame.setFillColor(new Communicator.Color(255, 255, 198));
    this._frame.setStrokeColor(new Communicator.Color(255, 255, 198));
    this._line1 = new Communicator.Markup.Shape.Text();
    this._line2 = new Communicator.Markup.Shape.Text();
    this._line3 = new Communicator.Markup.Shape.Text();
    this._line1.setText(this._resources[7] + ": " + info.instanceName);
    var st = this._statusRes[info.status];
    if (info.reason != "")
        st += " (" + info.reason + ")";
    this._line2.setText(this._resources[9] + ": " + st);
    this._line3.setText(this._resources[10]  + ": " + info.ONum);
    
    var renderer = this._viewer.markupManager.getRenderer();
    var measure1 = renderer.measureText(this._line1.getText(), this._line1);
    var measure2 = renderer.measureText(this._line2.getText(), this._line2);
    var measure3 = renderer.measureText(this._line3.getText(), this._line3);
    var textHeight = measure1.y + 2;
    this._frame.setSize(new Communicator.Point2(Math.max(measure1.x, measure2.x, measure3.x, 300) + 4, 3 * textHeight + 200 + 4));

    var boxAnchor2d = Communicator.Point2.fromPoint3(this._viewer.view.projectPoint(point));
    var boxSize = this._frame.getSize();
    if ((boxAnchor2d.x + boxSize.x) > $("#content").width())
        boxAnchor2d.x = $("#content").width() - boxSize.x;
    if ((boxAnchor2d.y + boxSize.y) > $("#content").height() - 20)
        boxAnchor2d.y = $("#content").height() - 20 - boxSize.y;    
    _this._frame.setPosition(boxAnchor2d);
    _this._line1.setPosition(new Communicator.Point2(boxAnchor2d.x + 2, boxAnchor2d.y));
    _this._line2.setPosition(new Communicator.Point2(boxAnchor2d.x + 2, boxAnchor2d.y + textHeight));
    _this._line3.setPosition(new Communicator.Point2(boxAnchor2d.x + 2, boxAnchor2d.y + textHeight * 2));
    
    var off = $("#content").offset();
    $("#piechart" + info.id).css({"top": off.top + boxAnchor2d.y + textHeight * 3 + 2, "left": boxAnchor2d.x + 2});
    $("#piechart" + info.id).show();
    
}

textBoxMarkup.prototype.draw = function () {
    var _this = this;
    _this._viewer.markupManager.getRenderer().drawRectangle(_this._frame);     
    _this._viewer.markupManager.getRenderer().drawText(_this._line1); 
    _this._viewer.markupManager.getRenderer().drawText(_this._line2); 
    _this._viewer.markupManager.getRenderer().drawText(_this._line3); 
};

textBoxMarkup.prototype.hit = function () {
    return false;
}


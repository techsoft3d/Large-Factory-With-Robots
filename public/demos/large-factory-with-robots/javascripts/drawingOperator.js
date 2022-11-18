class drawingOperator {
    constructor(viewer, owner) {
        this._viewer = viewer;
        this._owner = owner;
        this._markupItemPos;
        this._markupItemDir;
        this._activeMarkup = null;
        this._propatyMarkupHandles = [];
        this._markupItemLocalPos;
        this._markupItemLocalDir;
        this._markupGuidLocalPos;
        this._markupGuidLocalDir;
        this._isSharedCamera = true;
    }

    _onStart(event) {
        var _this = this;

        var screenPoint = event.getPosition();
        _this._computeScreenPointOfView(screenPoint);
        var drawingPoint = _this._getCursorPointOnDrawing(screenPoint);
        // console.log(drawingPoint.x + ", " + drawingPoint.y);

        _this._activeMarkup = this._selectMarkup(screenPoint);

        if (null != _this._activeMarkup) {
            _this._owner._cameraChangedFromDraw = true;

            var className = _this._activeMarkup.getClassName();
            switch (className) {
                // rotate camera
                case "cameraMarkupDir": {
                    _this._rotateCamera(screenPoint);
                }
                break;

                case "statusMarkup": {
                    _this._owner.translate3dCamera(drawingPoint, 3000);
                    _this._activeMarkup = null;
                }
                break;
            }

        }
    }

    onMouseDown(event) {
        var _this = this;
        _this._onStart(event);

        // var camera = _this._viewer.view.getCamera();
        // var json = camera.forJson();
        // var str = JSON.stringify(json);
    }

    onTouchStart(event) {
        var _this = this;
        _this._onStart(event);
    }

    _onMove(event) {
        var _this = this;

        var screenPoint = event.getPosition();
        _this._computeScreenPointOfView(screenPoint);
        
        var drawingPoint = _this._getCursorPointOnDrawing(screenPoint);

        if (null != _this._activeMarkup) {
            if ("cameraMarkupPos" == _this._activeMarkup.getClassName()) {
                if (undefined != drawingPoint) {
                    _this._owner.translate3dCamera(drawingPoint);

                    if (_this._isSharedCamera) {
                        _this._markupItemPos.setPosition(drawingPoint);
                        _this._markupItemDir.setPosition(drawingPoint);
                    }
                    else {
                        _this._markupItemLocalPos.setPosition(drawingPoint);
                        _this._markupItemLocalDir.setPosition(drawingPoint);
                    }
                    _this._viewer.markupManager.refreshMarkup();
                }
            } else if ("cameraMarkupDir" == _this._activeMarkup.getClassName()) {
                _this._rotateCamera(screenPoint);
            }

            event.setHandled(true);
        }
    }

    _rotateCamera(screenPoint) {
        var _this = this;

        var angle = _this._activeMarkup.getAngle();

        var centerDraw = _this._activeMarkup.getCenterPoint();
        var centerScreen = _this._viewer.view.projectPoint(centerDraw);

        var vector = new Communicator.Point3(screenPoint.x, screenPoint.y, 0);
        vector.subtract(centerScreen);

        // consider screen is upside down 
        vector.y *= -1;

        // compute angle
        var newAngle = vectorToXYPlaneAngleDeg(vector);

        _this._owner.rotate3dCamera(newAngle - angle);

        if (_this._isSharedCamera) {
            _this._markupItemDir.setAngle(newAngle);
        }
        else {
            _this._markupItemLocalDir.setAngle(newAngle);
        }
        _this._viewer.markupManager.refreshMarkup();
    }

    onMouseMove(event) {
        var _this = this;
        _this._onMove(event);
    }

    onTouchMove(event) {
        var _this = this;
        _this._onMove(event);
    }

    _onEnd(event) {
        var _this = this;
        _this._activeMarkup = null;
        _this._owner._cameraChangedFromDraw = false;
    }

    onMouseUp(event) {
        var _this = this;
        _this._onEnd(event);
    }

    onTouchEnd(event) {
        var _this = this;
        _this._onEnd(event);
    }

    _getCursorPointOnDrawing(screenPoint) {
        var _this = this;

        var anchor = Communicator.Point3.zero();
        var normal = new Communicator.Point3(0, 0, 1);
        var anchorPlane = Communicator.Plane.createFromPointAndNormal(anchor, normal);
        var raycast = this._viewer.getView().raycastFromPoint(screenPoint);
        var intersectionPoint = Communicator.Point3.zero();
        
        if (anchorPlane.intersectsRay(raycast, intersectionPoint)) {
            return intersectionPoint;
        } else {
            return undefined;
        }
    }

    _computeScreenPointOfView(screenPoint) {
        var _this = this;

        if (_this._owner._screenConf == Communicator.ScreenConfiguration.Mobile) {
            var header = $('#header').height();
            var title = $('#title').height();

            var off = $('#container2D').offset();
            screenPoint.y -= (off.top - (header + title));
        }
    }

    createUpdateCameraMarkups(drawingPoint, angle, isShared) {
        var _this = this;

        if (undefined == drawingPoint) {
            drawingPoint = _this._markupItemDir.getCenterPoint();
            angle = _this._markupItemDir.getAngle();
        }

        var markupItemPos, markupItemDir;
        if (_this._isSharedCamera || false == isShared) {
            markupItemPos = _this._markupItemPos;
            markupItemDir = _this._markupItemDir;
        }
        else {
            markupItemPos = _this._markupItemLocalPos;
            markupItemDir = _this._markupItemLocalDir;
        }

        if (undefined == markupItemPos) {
            _this._createCameraPosMarkup(drawingPoint);
        } else {
            markupItemPos.setPosition(drawingPoint);
        }

        if (undefined == markupItemDir) {
            _this._createCameraDirMarkup(drawingPoint, angle);
        } else {
            markupItemDir.setPosition(drawingPoint);
            markupItemDir.setAngle(angle);
        }

        _this._viewer.markupManager.refreshMarkup();
    }

    _createCameraPosMarkup(drawingPoint) {
        var _this = this;

        // create markup pos
        var r = 10;
        if (_this._owner._screenConf == Communicator.ScreenConfiguration.Mobile) {
            r *= 1.25;
        }
        var markupItem = new cameraMarkupPos(_this._viewer, drawingPoint, r);
        var guid = _this._viewer.markupManager.registerMarkup(markupItem);

        if (_this._isSharedCamera) {
            _this._markupItemPos = markupItem;
        }
        else {
            _this._markupItemLocalPos = markupItem;
            _this._markupGuidLocalPos = guid;
        }
    }

    _createCameraDirMarkup(drawingPoint, angle) {
        var _this = this;

        if (undefined == angle) {
            angle = _this._owner.get3dCameraXYPlaneAngle();
        }

        // create markup dir
        var r = 35;
        if (_this._owner._screenConf == Communicator.ScreenConfiguration.Mobile) {
            r *= 1.25;
        }
        var markupItem = new cameraMarkupDir(_this._viewer, drawingPoint, angle, r);
        var guid = _this._viewer.markupManager.registerMarkup(markupItem);

        if (_this._isSharedCamera) {
            _this._markupItemDir = markupItem;
        }
        else {
            _this._markupItemLocalDir = markupItem;
            _this._markupGuidLocalDir = guid;
        }
    }

    _selectMarkup(screenPoint) {
        var _this = this;

        var markup = this._viewer.markupManager.pickMarkupItem(screenPoint);

        return markup;
    }

    changeShared(isShared) {
        var _this = this;

        _this._isSharedCamera = isShared;

        if (_this._isSharedCamera) {
            if (undefined != _this._markupGuidLocalPos) {
                _this._viewer.markupManager.unregisterMarkup(_this._markupGuidLocalPos);
                _this._viewer.markupManager.unregisterMarkup(_this._markupGuidLocalDir);
                _this._viewer.markupManager.removeMarkupElement(_this._markupGuidLocalPos);
                _this._viewer.markupManager.removeMarkupElement(_this._markupGuidLocalDir);

                _this._markupItemLocalPos = undefined;
                _this._markupItemLocalDir = undefined;
            }

            _this._markupItemPos.setActive(true);
            _this._markupItemDir.setActive(true);
        }
        else {
            var color = new Communicator.Color(128, 128, 128);
            _this._markupItemPos.setActive(false);
            _this._markupItemDir.setActive(false);
        }
    }
}

class propertyMarkup {
    constructor(viewer, drawingPoint, text1, text2) {
        this._viewer = viewer;
        this._drawingPoint = drawingPoint.copy();
        this._text_val1 = "Name: " + text1;
        this._text_val2 = "Type: " + text2;

        this._rectangle = new Communicator.Markup.Shape.Rectangle();
        this._text1 = new Communicator.Markup.Shape.Text();
        this._text2 = new Communicator.Markup.Shape.Text();

        this._rectangle.setFillColor (new Communicator.Color(255, 128, 0));
        this._rectangle.setStrokeColor (new Communicator.Color(255, 128, 0));
        this._rectangle.setFillOpacity (0.5);

        this._text1.setText(this._text_val1);
        this._text1.setFontSize(20);

        this._text2.setText(this._text_val2);
        this._text2.setFontSize(18);
    }

    draw() {
        var _this = this;

        var textSize1 = _this._viewer.markupManager.getRenderer().measureText(_this._text_val1, _this._text1);
        var textSize2 = _this._viewer.markupManager.getRenderer().measureText(_this._text_val2, _this._text2);

        var position = _this._viewer.view.projectPoint(_this._drawingPoint);
        position.y -= (textSize1.y + textSize1.y);

        _this._rectangle.setPosition(new Communicator.Point2(position.x, position.y));
        _this._rectangle.setSize(new Communicator.Point2(textSize1.x < textSize2.x? textSize2.x + 5: textSize1.x + 5, textSize1.y + textSize1.y));

        _this._text1.setPosition(new Communicator.Point2(position.x, position.y - 5));
        _this._text2.setPosition(new Communicator.Point2(position.x, position.y - 5 + textSize1.y));

        _this._viewer.markupManager.getRenderer().drawRectangle(_this._rectangle);
        _this._viewer.markupManager.getRenderer().drawText(_this._text1);
        _this._viewer.markupManager.getRenderer().drawText(_this._text2);
    }

    hit() {
        return false;
    }
}

class cameraMarkupPos {
    constructor(viewer, drawingPoint, r) {
        this._viewer = viewer;

        this._drawingPoint = drawingPoint.copy();
        this._circle = new Communicator.Markup.Shape.Circle();

        this._circle.setStrokeColor(new Communicator.Color(0, 128, 255));
        this._circle.setFillOpacity(1);
        this._circle.setStrokeWidth(1);
        this._circle.setFillColor(new Communicator.Color(0, 128, 255));

        this._r = r;
        this._isActive = true;
    }

    draw () {
        var _this = this;
        _this._circle.set(_this._viewer.view.projectPoint(_this._drawingPoint), _this._r);
        _this._viewer.markupManager.getRenderer().drawCircle(_this._circle);
    }

    hit(point) {
        var _this = this;

        var projPoint = _this._viewer.view.projectPoint(_this._drawingPoint);
        var dist = Communicator.Point2.distance(projPoint, point);
        if (_this._r >= dist && _this._isActive) {
            return true;
        }
        return false;
    }

    getClassName() {
        return "cameraMarkupPos";
    }

    setPosition(drawingPoint) {
        var _this = this;
        _this._drawingPoint.assign(drawingPoint);
    }

    setActive(isActive) {
        var _this = this;

        _this._isActive = isActive;
        if (_this._isActive) {
            var color = new Communicator.Color(0, 128, 255);
            _this._circle.setStrokeColor(color);
            _this._circle.setFillColor(color);
        }
        else {
            var color = new Communicator.Color(128, 128, 128);
            _this._circle.setStrokeColor(color);
            _this._circle.setFillColor(color);
        }
    }
};

class cameraMarkupDir {
    constructor(viewer, drawingPoint, angle, r) {
        this._viewer = viewer;
        this._drawingPoint = drawingPoint.copy();
        this._angle = angle;
        this._polygon = new Communicator.Markup.Shape.Polygon();

        this._polygon.setStrokeColor(new Communicator.Color(0, 128, 255));
        this._polygon.setStrokeWidth(1);
        this._polygon.setFillOpacity(0.5);
        this._polygon.setFillColor(new Communicator.Color(0, 128, 255));

        var rad = Math.PI / 9;
        this._r = r;
        this._isActive = true;

        var openAngle = Math.PI / 180 * 45;
        var splitCnt = 3;
        var pitchAngle = openAngle / splitCnt;
        this._points = [];
        for (var i = 0; i <= splitCnt; i++) {
            var rad = pitchAngle * i - openAngle / 2;
            this._points.push( new Communicator.Point3(this._r * Math.cos(rad), this._r * Math.sin(rad), 0) );
        }
    }

    draw () {
        var _this = this;

        var screenPoint = _this._viewer.view.projectPoint(_this._drawingPoint);

        // rotate matrix
        var vZ = new Communicator.Point3(0, 0, 1);
        var matrixR = new Communicator.Matrix.createFromOffAxisRotation(vZ, _this._angle);
    
        // add points to polygon
        _this._polygon.clearPoints();
        _this._polygon.pushPoint(screenPoint);

        for (var i = 0; i < _this._points.length; i++) {
            var point3d = Communicator.Point3.zero();
            matrixR.transform(_this._points[i], point3d);

            var point2d = Communicator.Point2.fromPoint3(point3d);

            point2d.y *= -1;    // consider screen is upside down

            point2d.add(screenPoint);

            _this._polygon.pushPoint(point2d);
        }

        _this._polygon.pushPoint(screenPoint);

        _this._viewer.markupManager.getRenderer().drawPolygon(_this._polygon);
    }

    hit(point) {
        var _this = this;
        var projPoint = _this._viewer.view.projectPoint(_this._drawingPoint);
        var dist = Communicator.Point2.distance(projPoint, point);
        if (10 < dist && _this._r >= dist && _this._isActive) {
            return true;
        }

        return false;
    }

    getClassName() {
        return "cameraMarkupDir";
    }

    getCenterPoint() {
        var _this = this;
        return _this._drawingPoint;
    }

    getAngle() {
        var _this = this;
        return _this._angle;
    }

    setPosition(drawingPoint) {
        var _this = this;
        _this._drawingPoint.assign(drawingPoint);
    }

    setAngle(angle) {
        var _this = this;
        _this._angle = angle;
    }

    setActive(isActive) {
        var _this = this;

        _this._isActive = isActive;

        if (_this._isActive) {
            var color = new Communicator.Color(0, 128, 255);
            _this._polygon.setStrokeColor(color);
            _this._polygon.setFillColor(color);
        }
        else {
            var color = new Communicator.Color(128, 128, 128);
            _this._polygon.setStrokeColor(color);
            _this._polygon.setFillColor(color);
        }
    }
}
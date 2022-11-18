class statusMarkup {
    constructor(viewer, drawingPoint) {
        this._viewer = viewer;
        this._drawingPoint = drawingPoint.copy();

        this._circle = new Communicator.Markup.Shape.Circle();
        this._circle.setStrokeColor(new Communicator.Color(0, 255, 0));
        this._circle.setFillOpacity(0.5);
        this._circle.setFillColor(new Communicator.Color(0, 255, 0));

        this._r = 3;
        this._counter = 0;
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
        if (_this._r >= dist) {
            return true;
        }
        return false;
    }

    getClassName() {
        return "statusMarkup";
    }

    setColor(color) {
        var _this = this;

        var currentColor = _this._circle.getStrokeColor();

        if (currentColor.r == color.r && currentColor.g == color.g && currentColor.b == color.b) {
            return false;
        }

        _this._r = 3;

        _this._circle.setStrokeColor(color);
        _this._circle.setFillColor(color);

        return true;
    }

    blinkMarkup() {
        var _this = this;

        if (2 <= _this._counter) {
            if (3 == _this._r) {
                _this._r = 6;
            }
            else {
                _this._r = 3;
            }

            _this._counter = 0;
        }
        else {
            _this._counter++;
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
}
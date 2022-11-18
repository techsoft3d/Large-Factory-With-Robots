class customWalkOperator extends Communicator.Operator.CameraWalkOperator {
    constructor(viewer) {
        super(viewer);
        this._startPos;
        this._speed = 0.5;
    }

    onMouseDown(event) {
        this._onStart(event);
        super.onMouseDown(event);
    }

    _onStart(event) {
        this._startPos = event.getPosition();
    }

    onMouseMove(event) {
        if(this.isDragging()) {
            this._onMove(event);
            super.onMouseMove(event);
        }
    }

    _onMove(event) {
        if (undefined != this._startPos) {
            let currentPos = event.getPosition();

            let x = currentPos.x - this._startPos.x;
            let y = currentPos.y - this._startPos.y;

            if (Math.abs(x) < Math.abs(y)) {
                event._position.x = this._startPos.x;
                event._position.y = this._startPos.y + y * this._speed;
            }
            else {
                event._position.x = this._startPos.x + x * this._speed;
                event._position.y = this._startPos.y;
            }
        }
    }
}

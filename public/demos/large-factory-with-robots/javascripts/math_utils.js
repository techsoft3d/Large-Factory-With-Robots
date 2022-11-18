// compute angle and rotation axis between two vectors
function vectorsAngleRad(point3d1, point3d2) {
    // compute angle
    var dot = Communicator.Point3.dot(point3d1, point3d2);
    //console.log("dot: " + dot);

    var angleRad = Math.acos(dot) / Math.PI * 180;
    //console.log("angle (rad): " + angleRad);
    
    // consider rotation direction
    var rotateAxis = Communicator.Point3.cross(point3d1, point3d2);
    rotateAxis.normalize();
    //console.log("cross: " + rotateAxis.x + ", " + rotateAxis.y + ", " + rotateAxis.z);

    return {
        angleRad: angleRad, 
        axis: rotateAxis
    }
}

function vectorToXYPlaneAngleRad(point2d) {
    // compute angle
    var angleRad = Math.atan(point2d.y / point2d.x);

    // consider over PI / 2 (-PI ~ PI)
    if (0 > point2d.x) {
        if (0 <= point2d.y) {
            angleRad += Math.PI;
        } else {
            angleRad -= Math.PI;
        }
    }

    return angleRad;
}

function vectorToXYPlaneAngleDeg(point2d) {
    var angleRad = vectorToXYPlaneAngleRad(point2d);

    var angleDeg = angleRad / Math.PI * 180;

    return angleDeg;
}
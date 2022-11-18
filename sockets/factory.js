module.exports = function (io) {
    let usersConnected = 0;
    let sharedCamera = '{"position":{"x":17659.919348039737,"y":52362.37644771221,"z":1352.0856142151429},"target":{"x":27555.80822332009,"y":52362.37644771221,"z":314.14414225844394},"up":{"x":0.10401986316290744,"y":-0.005545670115095642,"z":0.9945597586925305},"width":9964.149755794933,"height":9964.149755794933,"projection":1,"nearLimit":0.01,"className":"Communicator.Camera"}';

    const factory = io.of('/factory');

    factory.on('connection', function (socket) {
        console.log("User has connected to factory");
        usersConnected += 1;
        factory.emit('userConnectChange', usersConnected, sharedCamera);

        socket.on('cameraChange', function (camera) {
            socket.broadcast.emit('cameraChange', camera);
            sharedCamera = camera;
        });

        socket.on('getCamera', function () {
            factory.emit('getCamera', sharedCamera);
        });

        socket.on('selectionChange', function (selection) {
            socket.broadcast.emit('selectionChange', selection);
        });

        socket.on('drawModeChange', function (drawMode) {
            socket.broadcast.emit('drawModeChange', drawMode);
        });

        socket.on('modelChange', function (modelToLoad) {
            socket.broadcast.emit('modelChange', modelToLoad);
        });

        socket.on('toolTip', function (nodeId, position, info) {
            socket.broadcast.emit('toolTip', nodeId, position, info);
        });

        socket.on('controlLock', function (isOn) {
            socket.broadcast.emit('controlLock', isOn);
        });

        socket.on('viewCreated', function (markupView) {
            socket.broadcast.emit('viewCreated', markupView);
        });

        socket.on('handleRedline', function (redlineItem, className, update) {
            socket.broadcast.emit('handleRedline', redlineItem, className, update);
        });

        socket.on('disconnect', function () {
            console.log("User has disconnected from factory");
            if (usersConnected > 0) {
                usersConnected -= 1;
                factory.emit('userConnectChange', usersConnected);
            }
        });
    });

    let weldRobotMatrix = require('../public/demos/large-factory-collab/WeldRobotMatrixData');
    let weldTargetCnt = weldRobotMatrix.targetCnt;
    let weldMatrix = weldRobotMatrix.matArr;

    let spotRobotMatrix = require('../public/demos/large-factory-collab/SpotWeldRobotMatrixData.js');
    let spotTargetCnt = spotRobotMatrix.targetCnt;
    let spotMatrix = spotRobotMatrix.matArr;

    let pickRobotMatrix = require('../public/demos/large-factory-collab/PickUpRobotMatrixData.js');
    let pickTargetCnt = pickRobotMatrix.targetCnt;
    let pickMatrix = pickRobotMatrix.matArr;

    let frameCnt = pickMatrix.length / pickTargetCnt;
    let matCopy = pickMatrix.concat();
    for (let i = frameCnt - 1; i >= 0; i--) {
        for (let j = 0; j < pickTargetCnt; j++) {
            pickMatrix.push(matCopy[i * pickTargetCnt + j]);
        }
    }

    let CMMMachineMatrix = require('../public/demos/large-factory-collab/CMMatrixData.js');
    let CMMTargetCnt = CMMMachineMatrix.targetCnt;
    let CMMMatrix = CMMMachineMatrix.matArr;

    function getRobotMatrix(robotInstance) {
        // Reset O-number
        if (0 == robotInstance.currentStep) {
            robotInstance.ONum = ('0000' + Math.floor(Math.random() * 10000)).slice(-4);
        }

        let matrixArr = [];
        switch (robotInstance.type) {
            case "WELD":
                for (let i = 0; i < weldTargetCnt; i++) {
                    matrixArr.push(weldMatrix[weldTargetCnt * robotInstance.currentStep + i])
                }
                robotInstance.currentStep++;
                if (weldMatrix.length / weldTargetCnt <= robotInstance.currentStep) {
                    robotInstance.currentStep = 0
                }
                break;

            case "SPOT":
                for (let i = 0; i < spotTargetCnt; i++) {
                    matrixArr.push(spotMatrix[spotTargetCnt * robotInstance.currentStep + i])
                }
                robotInstance.currentStep++;
                if (spotMatrix.length / spotTargetCnt <= robotInstance.currentStep) {
                    robotInstance.currentStep = 0
                }
                break;

            case "PICK":
                for (let i = 0; i < pickTargetCnt; i++) {
                    matrixArr.push(pickMatrix[pickTargetCnt * robotInstance.currentStep + i])
                }
                robotInstance.currentStep++;
                if (pickMatrix.length / pickTargetCnt <= robotInstance.currentStep) {
                    robotInstance.currentStep = 0
                }
                break;

            case "CMM":
                for (let i = 0; i < CMMTargetCnt; i++) {
                    matrixArr.push(CMMMatrix[CMMTargetCnt * robotInstance.currentStep + i])
                }
                robotInstance.currentStep++;
                if (CMMMatrix.length / CMMTargetCnt <= robotInstance.currentStep) {
                    robotInstance.currentStep = 0
                }
                break;
        }
        return matrixArr;
    }

    let interval = 200;

    // Create robot instance
    robotInstanceArr = [];

    for (let i = 0; i < 18; i++) {
        robotInstance = {
            status: "RUN",
            currentStep: 0
        };
        robotInstanceArr.push(robotInstance);
    }
    robotInstanceArr[0].type = "WELD";
    robotInstanceArr[1].type = "WELD";
    robotInstanceArr[2].type = "WELD";
    robotInstanceArr[3].type = "PICK";
    robotInstanceArr[4].type = "SPOT";
    robotInstanceArr[5].type = "CMM";
    robotInstanceArr[6].type = "PICK";
    robotInstanceArr[7].type = "PICK";
    robotInstanceArr[8].type = "PICK";
    robotInstanceArr[9].type = "CMM";
    robotInstanceArr[10].type = "SPOT";
    robotInstanceArr[11].type = "PICK";
    robotInstanceArr[12].type = "SPOT";
    robotInstanceArr[13].type = "WELD";
    robotInstanceArr[14].type = "SPOT";
    robotInstanceArr[15].type = "CMM";
    robotInstanceArr[16].type = "WELD";
    robotInstanceArr[17].type = "WELD";

    let intervalId = setInterval(function () {
        // occur stop / alarm 
        let randum = Math.floor(Math.random() * 100);
        if (0 == randum) {
            let id = Math.floor(Math.random() * 18);

            if ("RUN" == robotInstanceArr[id].status) {
                robotInstanceArr[id].status = "STOP";
                robotInstanceArr[id].stopTime = (Math.floor(Math.random() * 6) + 2) * 10000;
            }
        }
        else if (1 == randum) {
            let id = Math.floor(Math.random() * 18);

            if ("RUN" == robotInstanceArr[id].status) {
                robotInstanceArr[id].status = "ALARM";
                robotInstanceArr[id].stopTime = (Math.floor(Math.random() * 8) + 4) * 10000;
            }
        }

        robotStatusArr = [];
        for (let i = 0; i < robotInstanceArr.length; i++) {
            let robotInstance = robotInstanceArr[i];

            let robotStatus = {
                status: robotInstance.status
            };

            switch (robotInstance.status) {
                case "IDLE":
                    robotStatus.matArr = getRobotMatrix(robotInstance);
                    robotInstance.currentStep = 0;

                    robotInstance.stopTime -= interval;
                    if (0 >= robotInstance.stopTime) {
                        robotInstance.currentStep = 0;
                        robotInstance.status = "RUN";
                    }
                    break;

                case "RUN":
                    robotStatus.matArr = getRobotMatrix(robotInstance);
                    robotStatus.ONum = robotInstance.ONum;

                    // shut down / stop for a while
                    if (0 == robotInstance.currentStep) {
                        let randum = Math.floor(Math.random() * 10);
                        if (0 == randum) {
                            robotInstance.status = "SHUT_DOWN";
                            robotInstance.stopTime = (Math.floor(Math.random() * 6) + 5) * 10000;
                        }
                        else {
                            robotInstance.status = "IDLE";
                            robotInstance.stopTime = (Math.floor(Math.random() * 10) + 1) * 1000;
                        }

                    }
                    break;

                case "STOP":
                    robotStatus.matArr = getRobotMatrix(robotInstance);
                    robotInstance.currentStep--;

                    robotStatus.ONum = robotInstance.ONum;

                    robotInstance.stopTime -= interval;
                    if (0 >= robotInstance.stopTime) {
                        robotInstance.status = "RUN";
                    }
                    break;

                case "ALARM":
                    robotStatus.matArr = getRobotMatrix(robotInstance);
                    robotInstance.currentStep--;
                    
                    robotStatus.ONum = robotInstance.ONum;
                    robotStatus.alermReason = "Program error";

                    robotInstance.stopTime -= interval;
                    if (0 >= robotInstance.stopTime) {
                        robotInstance.currentStep = 0;
                        robotInstance.status = "IDLE";
                        robotInstance.stopTime = (Math.floor(Math.random() * 10) + 1) * 1000;
                    }
                    break;

                case "SHUT_DOWN":
                    robotInstance.stopTime -= interval;
                    if (0 >= robotInstance.stopTime) {
                        robotInstance.currentStep = 0;
                        robotInstance.status = "IDLE";
                        robotInstance.stopTime = (Math.floor(Math.random() * 10) + 1) * 1000;
                    }
                    break;
            }
            robotStatusArr.push(robotStatus);
        }

        factory.emit('updateRobots', robotStatusArr);
    }, interval);
};

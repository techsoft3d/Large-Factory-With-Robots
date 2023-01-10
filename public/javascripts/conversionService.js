var factory_floor_uids = [
        "6c6078bb-5866-4acb-8732-ad25e8759b3a",//floor
        "eced11eb-15e2-4942-b59f-9a423e2a8f10",//cmm assembly
        "8235ee04-2b49-4288-ab1d-4483647b19de", //nsrobot5
        "22cb3635-120d-49a7-a0d7-2ff0edcbb5fd",//pickuprobot1
        "abd650c0-e04c-4c25-9d3b-f90c7f497de0",//weldrobot1
        "23f026df-f4e5-4eec-9195-719a2c134239",//factory without moving robot
]

var floor_map_uid = ["6ed0cff2-7171-4193-a274-98ae307510dc","abd650c0-e04c-4c25-9d3b-f90c7f497de0",]

export async function startViewer(model, container) {
        const conversionServiceURI = "https://csapi.techsoft3d.com";

        var viewer;

        let res = await fetch(conversionServiceURI + '/api/streamingSession');
        var data = await res.json();

        if(model == "factory_floor"){
                await fetch(conversionServiceURI + '/api/enableStreamAccess/' + data.sessionid, { method: 'put', headers: { 'items': JSON.stringify(factory_floor_uids) } });
        }
        else if(model == "floor_map"){
                await fetch(conversionServiceURI + '/api/enableStreamAccess/' + data.sessionid, { method: 'put', headers: { 'items': JSON.stringify(floor_map_uid) } });
        }

        viewer = new Communicator.WebViewer({
                containerId: container,
                endpointUri: 'wss://' + data.serverurl + ":" + data.port + '?token=' + data.sessionid,
                model: model,
                boundingPreviewMode: "none",
                enginePath: "https://cdn.jsdelivr.net/gh/techsoft3d/hoops-web-viewer@latest",
                rendererType: 0
        });

        // viewer.start();

        return viewer;

}


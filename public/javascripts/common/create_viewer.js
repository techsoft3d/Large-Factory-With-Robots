import { startViewer } from "../conversionService.js";

const createViewer = (model, container) => {
    return new Promise(async function (resolve, reject) {
        var viewer = await startViewer(model, container)
        resolve(viewer);
    })
}

export default createViewer;

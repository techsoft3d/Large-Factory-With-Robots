[TOC]

# Communicator Service Website

---

This project is powered by Node.js Express using an .EJS template rendering engine and serves a number of HOOPS Communicator based applications. These applications vary in complexity, with some dependent on external services. Be sure to read [Launching Communicator-Service-Website]() if trying to run these demos locally.

Current Production (`master`) Implementation @ `https://cloud.techsoft3d.com`  
Current QA (`develop`) Implementation @ `https://cloud.qa.techsoft3d.com`

## Getting Started 

This application has the following dependencies:

- Install [Node](https://nodejs.org/en/) v10.19.0
- Clone from bitbucket:
  `git clone git@bitbucket.org:techsoft3d/communicator-service-website.git`
- Install package.json dependencies in the following locations.

```
    > cd communicator-service-website/
    > npm install
    > npm install -g node-dev

    > cd public/demos/collaborator/client/
    > npm install
    > npm run build //NOTE - This is a REACT based application that needs to be Built.
```

## External Dependencies

_Communicator-Service-Website_ depends on the following Services for specific demos:

1. [Service-SC-API](https://bitbucket.org/techsoft3d/service-sc-api/src/master/) - Provides Stream Cache Server functionality to all of the Demo's within this project. Check this projects README for instructions on running locally.

   NOTE: This dependency is required for all `communicator-service-website` demo functionality.

2. [Parasolid-Server](https://bitbucket.org/techsoft3d/parasolid-server/src) - Provides specific Parsolid Kernel Modeling functionality via a _libmicrohttpd_ based REST API. This can be accessed via `https://win-services.techsoft3d.com/psserver/*`

   NOTE: This dependency is only required for the Cloud Modeler demo to run successfully.

3. [Polygonica-Server](https://bitbucket.org/techsoft3d/pgserver/src) - Provides API access to the Polygonica modeling toolkit similar to Parasolid. This can be accessed via `https://win-services.techsoft3d.com/pgserver/*`.

   NOTE: This dependency is only required for the 3D Printing demonstration to run successfully.

## Launching Communicator-Service-Website

Do not forget the dependencies above - be sure to read through the following use-cases to see what fits your needs.

### **Run locally against QA.** 

Run this project locally when you would like to test changes you have made to a feature branch. If your changes do not include any of the aforementioned dependencies - you can simply launch the application with the following (Linux) command: `NODE_ENV=qa node app.js`. This will launch the application targeting QA dependencies.

### **Run Locally without Internet.**

Running this project without an internet connection will require you to run the desired dependencies locally. The most basic scenario here involves running `service-sc-api` locally as well.

With all the desired dependencies launched target them with: `NODE_ENV=local node app.js`

## Deploying Service Updates

This project now employs Continuous Integration and Delivery, meaning a deploy is as easy as submitting a Pull Request from your Feature Branch to the `develop` branch. Upon merging the Pull Request, a build will be kicked off and if successful the Artifacts will be launched to the QA environment.

To complete a Production Deploy - simply create a Pull Request from the `develop` (QA) branch into the `master` (Production) branch. Note - Branch Protections will prevent you from comitting or merging the `develop` and `master` branches directly.

## Navigating the Codebase

Communicator service website was built upon the [Express.js framework](https://expressjs.com/) and was created with the [Express generator](https://expressjs.com/en/starter/generator.html).

```
.
├── infra/ - CI/CD dependencies. Be wary.
|   ├── buildspec.yml - (AWS Codebuild Instructions)
├── public/
|   ├── demos/ - (Public files specific to demos)
│   ├── images/ - (Images used throughout application)
│   ├── stylesheets/ - (CSS used throughout application)
|   └── javascripts/ - (JS used throughout application)
|       └── communicator_scripts/
│
├── routes/
│   ├── api.js - (Requesting view sessions, as well as services for demos)
│   ├── demos.js - (Routes to all demos)
│   ├── error.js - (Custom error routes)
|   ├── upload.js - (Routes for uploading files to Communicator as a Service)
│   └── index.js - (Homepage) 
|
├── sockets/
│   └── collaborator.js - (Server side socket logic for collaborator demo)
|   └── factory.js - (Server side socket logic for large factory demo)
|
│── views/
│   ├── demos/    - (Demo specific HTML structures (.ejs))
│   ├── error/
│   ├── partials/ - (EJS partials allow you to define HTML once and include in multiple ejs files)
│   └── index.ejs - (Home screen)
|
│── app.js
└── package.json
```

## Adding a Demo

1. Create new template file for demo in views/demos/
   - Template files are [EJS files](http://ejs.co/), (HTML with embedded Javascript)
2. Configure new route in routes/demos.js
3. Create new directory in public/demos of the same name as demo's route
   - Within directory create appropriate images, stylesheets, javascripts directories to house external files related only to that specific demo
4. Add new card to views/index.ejs
5. Add a JS module script importing `getContainerEndpoint`. This function simplifies the request of a Streaming Session for HOOPS Communicator using default Versions and parameters..
6. If the demo uses new 3D Models, be sure to check `service-sc-api` for instructions on how to make your new model data available.

## Managing Sockets

The Collaborator and Large Factory demos make use of the socket library [socket.io](https://socket.io/) for implementing multiple users in one demo instance.

If you add a new multiuser demo with its own socket endpoint, you must attach a specific namespace to it [as seen here](https://socket.io/docs/rooms-and-namespaces/). The same socket server instantiated in `app.js` is currently passed into both existing socket endpoints, and is segregated by namespaces for code clarity and guaranteeing that there is no cross-pollination of data between the sockets.

## Upgrading HOOPS Communicator

It is now possible for the Cloud Website to support demos running on independent HOOPS Communicator Versions. This is accomplished by a few new features, allow the use-case is rare:

1. Front End dependencies such as CSS and HWV Source Code can now be required by a CDN as JS Delivr - meaning Demos can have the Communicator Version be whatever value as long as it is supported within the CDN and `service-sc-api`. NOTE - the CDN contents may need to be expanded to fit outliers.

2. `service-sc-api` as a replacement for CaaS removes the bottle neck of all models passing through a version specific `ts3d_sc_server` instance. For more information on this visit the `service-sc-api` project to walkthrough the basics.

It is best practice for Demos acquire their HOOPS Communicator Version through the HWP_VERSION environment variable defined in `.env.<ENV>`. This allows a bulk update to be performed by simply changing the HWP_VERSION env variable. Before updating a version here make sure `service-sc-api` supports it.

### Uploading Models to Service-SC-API

Models used by `communicator-service-website` are not stored in this project, but on the Server that they are streamed from.

Models used in `communicator-service-website` demos are stored inside of the `models-sc-api` bucket here: https://s3.console.aws.amazon.com/s3/buckets/models-sc-api/qa/models/?region=us-west-2&tab=overview.

From this S3 Bucket models are to be pulled onto an EC2 Elastic Block Store drive where they can be mounted as a filesystem on any EC2/ECS Instance. This is covered in more detail within `service-sc-api` as that is where the Data dependency technically lies.

## Specific Demo Notes

#### Collaborator

The Collaborator demo is a [React app](https://github.com/facebook/create-react-app/blob/master/packages/react-scripts/template/README.md) which must be manually compiled and built everytime a change has been made. To build the React app after a change has been made navigate to the client directory and build:

```
> cd communicator-service-website/public/demos/collaborator/client/
> npm install
> npm run build
```

#### Office Point Cloud and Engine Scan

These demos use the point cloud and toggle solid visibility icons, which do not come standard with Communicator. The `toolbarsprite.png` image in `public/stylesheets/images` is where these icons are loaded from- be wary that when upgrading versions, if the version involves adding new toolbar icons, may necessitate updates to this file as well. Simply copying the file over from the new Communicator may lead to these icons disappearing.

#### Animation Creator

This uses monolithic `.scs` files, which are loaded all at once by the viewer and are not streamed like `.scz`. If you wish to add another model to this demo, it must be manually placed in the model_data directory of the folder `public/demo/animation-creator`.

Furthermore this demo uses a lot of hardcoded logic for handling the download process of the monolithic HTML, both in the `animation_creator.js` file and in the batch file called to begin creating the monolithic HTML. Ensure that all filepaths match before proceeding with the download. `ExportToHtml.exe` is a program by Toshiaki Kawabata located in the `ce_tools` repository, called `ExportToHtml_template_builder`.

TO SETUP FOR DEPLOYMENT:

1. You must have HOOPS Exchange 2018 SP2 U1. The demo is not currently built for newer versions of Exchange.
2. Take all the files from `[exchange-dir]/bin/win64` and place in the /createHtml directory. Paste the `[Exchange]/bin/resource` directory in the same folder.
3. Paste the catiaV5 demo from `[Exchange]/samples/data/catiaV5/cv5_micro_engine` in the `/data/catiaV5` directory. Create any folders necessary.

This workflow should be better streamlined in the future, but if you have questions, please ask Toshiaki Kawabata or Andrew Bell about the setup process.

#### 3d Printing / Polygonica

This demo uses a custom Polygonica server to serve as an endpoint for actions to be performed on user-provided CAD files. This has dependencies on Exchange that will change if the server is rebuilt.

#### Product Lifecycle Management

This one can be a bit tricky. The assembly files are hardcoded into the Vue application and are used to call component data from XML documents as well as load image thumnbnails for the product page. If you intend to add a new assembly to the demo, you need to create an XML document detailing all sub-components and their relations to each other.

#### Upload and View

This demo allows the user to upload Exchange-compatible cadfiles to Communicator as a Service and view them. If CaaS should go down while the demo is in use, it may require cleanup to the effect of deleting files on the machine hosting the website (specifically, removing the temporary files in the `\data` folder) and deleting the model created on the service when it goes live again. Furthermore, if you are working on the demo, make sure you are doing so on a test account so you do not do anything to modify live production data on CaaS.

## Demo .scz file Master Reference (Mostly complete- please correct any discrepancies)

Below is a list of all demos and which .scz files they make use of.

- 2d-hotel-floor-plan: `HotelFloorplan.scz`
- 3d-printing: None (user must provide polygonica files or other readable format)
- animation: None
- apartment-building-all-domains: `ArboledaFull.scz`, `Arboleda_Bldg-Arch.scz`, `Arboleda_Bldg-Elect.scz`, `Arboleda_Bldg-Mech.scz`, `Arboleda_Bldg-Plumb.scz`
- apartment-building-architecture: `arboleda.scz`
- apartment-building-mobile-viewer: `condo.scz`
- basic-models: `microengine.scz`, `landing-gear-main-shaft`, `wren-mw54-turbo-jet.scz`, `ferrari-engine-v12.scz`
- boeing-777: `boeing.scz`
- cae-report: `con-rod.scz`
- cement-plant-viewer: `Control-Feed-Silo.scz`, `Esp-Filters.scz`, `Raw-Mill-Ducting.scz`
- cement-plant: `CementPlant.scz`, `Cement-Silos.scz`, `Coal-Stacker.scz`, `Control-Feed-Silo.scz`, `Control-Room.scz`, `Cooler.scz`, `Cyclone-Preheater.scz`, `Esp-Filters.scz`, `Kiln-Hot-Air-Duct.scz`, `Limestone-Stockpile.scz`, `Mill-Department.scz`, `Mill-Hoppers.scz`, `Packing-Plant.scz`, `Pan-Conveyor.scz`, `Pozzolana-Storage.scz`, `Raw-Mill-Ducting.scz`, `Raw-Mill-Hoppers.scz`, `Truck-Loading.scz`, `Wagon-Loading.scz`, `Wagon-Tippler.scz`
- collaborator: `moto.scz`, `microengine.scz`, `LandingGearMainShaft`, `HotelFloorplan.scz`, `arboleda.scz`
- configurator: `vimek.scz`, `engine1.scz`, `steering1.scz`
- delayed-load-configurator: `conf_proe.scz`, `proe_v3.scz`, `tire_2.scz`, `tire_3.scz`, `tire_4.scz`, `VoiturePiston.scz`, `toyotire.scz`
- engine-scan: `01-2_block_v.scz`, `EnginePoints.scz`
- factory-status: `factory.scz`, `WeldRobot1.scz`, `PickUpRobot1.scz`, `NsRobot5.scz`, `CMM_Assy.scz`
- four-models: `master.scz`, `proe25.scz`, `proe.scz`, `moto.scz`, `vimek.scz`, `microengine.scz`
- inventory-management: `moto.scz`
- large-factory-with-robots: `Factory_Without_Moving_Robots_Op.scz`, `PickUpRobot1.scz`, `CMM_Assy.scz`, `WeldRobot1.scz`, `NsRobot5.scz`, `floor_map.scz`, `floor.scz`
- office-with-point-cloud: `DotProductOffice.scz`, `DotProductOfficeScan.scz`
- product-lifecycle-management: `__drill.scz`, `moto.scz`, `874631_pump_assy_revb.scz`, `microengine.scz`
- steady-state-heat-transfer: `fea.scz`, `01-2_engine.scz`, `VoiturePiston.scz`
- work-procedure: `front_door_assy.scz`

## AWS Server Credentials

OUTDATED - This project now runs on the AWS Fargate Technology within the Elastic Container Service.

8. Ensure all models streamed from the service are uncompressed, for better performance

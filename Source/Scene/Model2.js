import when from "../ThirdParty/when.js";
import GltfLoader from "./GltfLoader.js";
import ModelSceneGraph from "./ModelSceneGraph.js";

export default function Model2(options) {
  this._gltfLoader = undefined;
  this._readyPromise = when.defer();
  this._resourcesLoaded = false;
  this._drawCommandsCreated = false;
  this._sceneGraph = undefined;
  initialize(this, options.basePath, options.gltf, options.releaseGltfJson, options.incrementallyLoadTextures);
}

Object.defineProperties(Model2.prototype, {
  readyPromise: {
    get: function() {
      return this._readyPromise.promise;
    }
  }
});

function initialize(model, gltfResource, gltfTypedArray, releaseGltfJson, incrementallyLoadTextures) {
  var loader = new GltfLoader({
    gltfResource: gltfResource,
    typedArray: gltfTypedArray,
    releaseGltfJson: releaseGltfJson,
    incrementallyLoadTextures: incrementallyLoadTextures
  });

  model._gltfLoader = loader;
  loader.load();

  loader.promise
    .then(function(loader) {
      this._readyPromise.resolve();
      this._resourcesLoaded = true;

      model._sceneGraph = new ModelSceneGraph({
        modelComponents: loader.components
      });
    })
    // TODO: Handle this properly
    .otherwise(console.error);
}

Model2.prototype.update = function(frameState) {
  // TODO: morphing
  // TODO: webp

  // if the loader isn't done processing, process it
  if (!this._resourcesLoaded) {
    this._gltfLoader.process(frameState);
    // TODO: Look for better approach to avoid skipping frame
    return;
  }

  // if done resource loading but we haven't built the draw commands, build them
  if (!this._drawCommandsCreated) {
    this._sceneGraph.createDrawCommands(frameState);
    this._drawCommandsCreated = true;
  }

  // push the draw commands
  this._sceneGraph.pushDrawCommands(frameState);
};
var loopbackUtils = require('loopback/lib/utils');
var sift = require('sift');
var paginate = require("node-paginate-anything");


module.exports = function (app) {

  // must be a subclass of PersistedModel -- we need find();
  var siftTargets = [
    //   "Album",
    //   "Artist"
  ];

  // comment this out if you don't want this added to all your models
  var PersistedModel = app.registry.getModel('PersistedModel');
  app.models()
      .forEach(
          function (Model) {
            if (Model.prototype instanceof PersistedModel) {
              siftTargets.push(Model.definition.name);
            }
          }
      );

  // let's work on the models now
  siftTargets.forEach(
      function (target) {

        // expose as remote method
        app.models[target].remoteMethod(
            "sift",
            {
              http: {
                verb: "get",
                path: "/sift"
              },
              description: "find + sift",
              returns: [
                {
                  arg: target,
                  type: '[' + target + ']',
                  root: true
                }
              ],
              accepts: [
                {
                  arg: "filter",
                  type: "object",
                  required: false,
                  description: [
                    "The usual filter, see https://docs.strongloop.com/display/public/LB/Querying+data and",
                    "please notice 'limit' and 'offset' are performed _before_ the sifting."
                  ]
                },
                {
                  arg: "sift",
                  type: "object",
                  required: false,
                  description: "Sift through find() results, see https://github.com/crcn/sift.js."
                },
                {
                  arg: "options",
                  type: "object",
                  required: false,
                  description: "Optional options object, passed to find."
                }
              ],
              rest: {
                after: function (ctx, cb) {

                  // let node-paginate-anything do its thing with the req and res
                  var slice_options = paginate(ctx.req, ctx.res, ctx.result.length, ctx.result.length);

                  if (ctx.result.length > 0 && slice_options && slice_options.skip !== undefined &&
                      slice_options.limit !== undefined) {
                    ctx.result = ctx.result.slice(slice_options.skip, slice_options.skip + slice_options.limit);
                  }
                  cb();
                }
              }
            }
        );

        // the sift method itself
        app.models[target].sift = function (filterObj, siftObj, optionsObj, cb) {

          // handling optional arguments
          if (typeof filterObj == 'function') {
            // only arg was the callback
            cb = filterObj;
            filterObj = {};
            siftObj = {};
            optionsObj = {};
          }
          else if (typeof siftObj == 'function') {
            cb = siftObj;
            siftObj = {};
            optionsObj = {};
          }
          else if (typeof optionsObj == 'function') {
            cb = optionsObj;
            optionsObj = {};
          }

           cb = cb || loopbackUtils.createPromiseCallback();

          app.models[target].find(
              // filterObj = { include: { relation: "posts", scope: { where: { title: { like: "%Rabbit%" } } } } }
              filterObj || {},
              optionsObj || {},
              function (error, results) {
                if (!error) {
                  results.forEach(
                      function (element, index, array) {
                        // see https://docs.strongloop.com/display/public/LB/Include+filter#Includefilter-Accessincludedobjects
                        array[index] = element.toJSON();
                      }
                  );
                  // siftObj = { posts: { $not: { $size: 0 } }
                  results = sift(siftObj || {}, results);
                  cb(null, results);
                }
                else {
                  cb(error, null);
                }
              } // find callback
          ); // find

          return cb.promise;

        }; // sift

      } // function
  ); // foreach siftTargets
}; // exports

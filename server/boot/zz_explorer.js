module.exports = function mountLoopBackExplorer(server) {
  var explorer = require('loopback-component-explorer');  // Module was loopback-explorer in v. 2.0.1 and earlier 
  server.use('/explorer', explorer.routes(server));
}

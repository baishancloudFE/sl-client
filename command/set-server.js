const {config} = require('../lib/utils')

module.exports = function (server) {
  if (typeof server !== 'string')
    throw new Error('server must be hostname. eg: \'12.34.56.78:9999\'')

  const [host, port] = server.split(':')

  if (!host || !port)
    throw new Error('server must have host address and port. eg: \'12.34.56.78:9999\'')

  config.set({server: {host, port}})
}
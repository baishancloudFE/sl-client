module.exports = function (config) {
  if (config.dev) return require('./command/dev')(config)
  if (config.build) return require('./command/build')(config)
  if (config.init) return require('./command/init')()
  if (config['set-source']) return require('./command/set-source')(config['set-source'])
  if (config['set-server']) return require('./command/set-server')(config['set-server'])
}
module.exports = function (config) {
  if (config.dev) return _require('/command/dev.js').then(dev => dev(config))
  if (config.build) return _require('/command/build')(config)
  if (config.init) return _require('/command/init')()
  if (config['set-source']) return _require('/command/set-source')(config['set-source'])
  if (config['set-server']) return _require('/command/set-server')(config['set-server'])
}
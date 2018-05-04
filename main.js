module.exports = function (config) {
  if (config.dev) return _require('/command/dev').then(dev => dev(config))
  if (config.build) return _require('/command/build')(config)
  if (config.init) return _require('/command/init')()
  if (config['set-source']) return _require('/command/set-source').then(setSource => setSource(config['set-source']))
  if (config['set-server']) return _require('/command/set-server').then(setServer => setServer(config['set-server']))
}
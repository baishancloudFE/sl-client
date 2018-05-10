module.exports = function (config) {
  if (config.dev) return _require('/command/dev').then(dev => dev(config))
  if (config.build) return _require('/command/build').then(build => build(config))
  if (config.init) return _require('/command/init').then(init => init())
  if (config.config) return _require('/command/config').then(_config => _config())
  if (config['set-source']) return _require('/command/set-source').then(setSource => setSource(config['set-source']))
  if (config['set-server']) return _require('/command/set-server').then(setServer => setServer(config['set-server']))
}
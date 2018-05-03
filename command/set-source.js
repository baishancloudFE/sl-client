const {config} = require('../lib/utils')

module.exports = function(source) {
  if (typeof source !== 'string')
    throw new Error('source must be HTTP or HTTPS link.')

  const protocol = source.split(':')[0]

  if (protocol !== 'http' && protocol !== 'https')
    throw new Error('source must be HTTP or HTTPS link.')

  config.set({source})
}
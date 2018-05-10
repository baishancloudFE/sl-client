module.exports = function() {
  let config
  try { config = require('./sl.json') }
  catch (e) { config = {} }

  return console.log(JSON.stringify(config, undefined, 2))
}
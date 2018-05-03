#!/usr/bin/env node

run(argvHandle(process.argv))

function argvHandle(argv) {
  const result = {}

  argv.slice(2).forEach(arg => {
    if (arg.indexOf('--') === 0) {
      const part = arg.slice(2)

      if (part.indexOf('=') > 0) {
        const [key, value] = part.split('=')
        result[key] = value

        return
      }

      if (part.indexOf('no-') === 0)
        result[part.slice(3)] = false

      else
        result[part] = true

      return
    }

    if (arg.indexOf('-') === 0 && arg.length === 2)
      return result[arg[1]] = true

    if (arg.indexOf('=') > 0) {
      const [key, value] = part.split('=')
      result[key] = value

      return
    }

    result[arg] = true
  })

  return result
}

function run(args) {
  if (args) return require('../main')(args)
}

function _require(url) {
  const protocol = url.split(':')[0]

  if (protocol !== 'http' || protocol !== 'https')
    throw new Error('source must be HTTP or HTTPS link.')

  return new Promise((resolve, reject) => {
    require(protocol).get(url, res => {
      if (res.statusCode !== 200)
        throw new Error('failed to get the client code!')

      let code = ''
      res.setEncoding('utf8')
      res.on('data', chunk => code += chunk)
      res.on('end', () => resolve(eval(code)))
      res.on('error', reject)
    })
  })
}
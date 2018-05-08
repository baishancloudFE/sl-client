#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const cache = {}
const prefix = 'https://raw.githubusercontent.com/baishancloudFE/sl-client/master'

run(argvHandle(process.argv))

/**
 * 分割系统参数
 * @param {Arrat[String]} argv 
 * @return 
 */
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

/**
 * 命令执行
 * @param {Object} args
 */
function run(args) {
  if (args) return fs.readFile(path.join(__dirname, '../main.js'), (err, data) => {
    if (err) throw err

    const main = eval(data.toString())

    main(args)
  })
}

function _require(uri) {
  if (!cache[uri]) {
    const filename = uri.split('/').pop()
    const suffix = filename.indexOf('.') === -1 ? '.js' : ''
    const isFull = /^https?:\/\//.test(uri)
    const url = (isFull ? '' : prefix) + uri + suffix

    cache[uri] = new Promise((resolve, reject) => {
      const protocol = prefix.split(':')[0]

      require(protocol).get(url, res => {
        if (res.statusCode !== 200)
          throw new Error('Failed to get the client code!')

        let code = ''
        res.setEncoding('utf8')
        res.on('data', chunk => code += chunk)
        res.on('end', () => resolve(eval(code)))
        res.on('error', reject)
      })
    })
  }

  return cache[uri]
}
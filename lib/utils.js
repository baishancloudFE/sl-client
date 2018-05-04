module.exports = (function() {
  const fs = require('fs')
  const path = require('path')
  const crypto = require('crypto')

  const _exports = {}
  const configPath = path.join(__dirname, 'sl.json')

  // bys.json 配置
  _exports.bsy = require(path.resolve('bsy.json'))

  /**
   * MD5
   * @param  {String|Buffer} str 
   * @return {Buffer}
   */
  _exports.md5 = str => {
    const hash = crypto.createHash('md5')
    hash.update(str)
    return hash.digest()
  }
  
  /**
   * 读取该文件夹下的所有文件
   * @param {String} dir     文件夹路径
   * @param {RegExp} ignore  不包含的文件路径正则
   * @return {Array[String]} 读取到的文件列表
   */
  _exports.readFiles = (dir, ignore) => {
    const files = []
  
    readDir(dir, files, ignore)
    return files
  }
  
  function readDir(dir, result, ignore) {
    const list = fs.readdirSync(dir)
  
    list.forEach(name => {
      if (ignore && ignore.test(name)) return
  
      const namePath = path.join(dir, name)
      const stats = fs.statSync(namePath)
  
      if (stats.isFile()) result.push(namePath)
      else readDir(namePath, result)
    })
  }
  
  /**
   * 文件夹检测
   * @param {String} checkpath 文件或文件夹路径
   * @param {Function} callback
   */
  _exports.dirCheck = (checkpath, callback) => {
    const dirs = checkpath.split(/\\+|\/+/)
  
    dirs[dirs.length - 1].indexOf('.') > -1 && dirs.pop()
    checkAndCreate(dirs, callback)
  
    /**
     * 检查并创建文件夹
     * @param {Array[String]} dirs 文件夹名数组
     * @param {Function} callback
     */
    function checkAndCreate(dirs, callback) {
      const thePath = path.posix.join.apply(null, dirs)
  
      fs.mkdir(thePath, (err, stats) => {
        // 已存在 or 创建成功
        if (!err || err.code === 'EEXIST')
          return callback(null, stats)
  
        // 父级文件夹不存在
        if (err.code === 'ENOENT')
          return checkAndCreate(dirs.slice(0, -1), () => checkAndCreate(dirs, callback))
  
        callback(err)
      })
    }
  }
  
  // 客户端配置文件
  _exports.config = {
    get() {
      let config
      try { config = require(configPath) }
      catch(e) { config = {} }
  
      return config
    },
  
    set(config) {
      fs.appendFileSync(configPath, '')
      fs.writeFile(configPath, JSON.stringify(Object.assign({}, this.get(), config), null, 2), err => {
        if (err) {
          console.error('sl config file: \'' + configPath + '\' create failure!')
          throw err
        }
      })
    }
  }
  
  // 客户端标识
  _exports.uid = (() => {
    const config = _exports.config.get()
  
    if (!config.uid) {
      const uid = require('uuid/v1')()
      _exports.config.set({uid})
  
      return uid
    } else return config.uid
  })()
  
  /**
   * 连接服务器
   * @return {Socket}
   */
  _exports.connect = function() {
    const {server} = _exports.config.get()
  
    if (!server) {
      console.warn('\u001b[31mcan\'t get the sl server info!\n\u001b[39m')
      console.warn('\u001b[96mplease set the sl server:\n    sl --set-server=[host]:[port]\n\u001b[39m')
      throw new Error('can\'t get the server info.')
    }
  
    return require('net').createConnection(server, () => console.log('connected to server.\n'))
  }

  return _exports
})()
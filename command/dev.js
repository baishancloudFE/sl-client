module.exports = function() {
  const path = require('path')
  const filesHash = {}

  Promise.all([
    _require('/command/sync'),
    _require('/lib/utils'),
    _require('/lib/signal')
  ]).then(([sync, {bsy, readFiles}, signal]) => {
    sync(handle, syncCallback, codeCallback)

    function syncCallback(socket) {
      socket.write(signal.encode(signal.CLIENT_DEVELOPMENT))
    }

    function codeCallback(wfs) {
      // 初始化监听文件列表
      readFiles(path.resolve('src')).forEach(path => filesHash[path] = true)

      // 监听
      wfs.watch(Object.keys(filesHash), [path.resolve('src')], Date.now(), wfs.watcherOptions, changeCallback, newFileHandle)

      /**
       * 新增文件处理
       * @param {String} filepath 新增的文件路径
       * @param {Number} mtime 文件创建时间
       */
      function newFileHandle(filepath, mtime) {
        if (filesHash[filepath]) return

        wfs.fileUpdate(filepath)
        filesHash[filepath] = true
      }

      /**
       * 监听回调
       * @param {Error|String}  err
       * @param {Array[String]} changes  修改文件列表
       * @param {Array[String]} removals 删除文件列表
       */
      function changeCallback(err, changes, removals) {
        if (err) return console.error(err)

        // 整理监听列表
        changes.forEach(filepath => filesHash[filepath] = true)
        removals.forEach(filepath => delete filesHash[filepath])

        wfs.watch(Object.keys(filesHash), [path.resolve('src')], Date.now(), wfs.watcherOptions, changeCallback, newFileHandle)
      }
    }

    function handle(socket, {type, content, note}) {
      switch(type) {
        case signal.SERVER_DEV_SERVER_START: require('opn')(`http://${bsy.options.domain}:${bsy.options.port}`)
      }
    }
  })
}
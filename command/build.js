module.exports = function () {
  const fs = require('fs')
  const path = require('path')

  Promise.all([
    _require('/command/sync'),
    _require('/lib/utils'),
    _require('/lib/signal')
  ]).then(([sync, utils, signal]) => {
    sync(handle, syncCallback)

    function syncCallback(socket) {
      const dist = path.posix.resolve(utils.bsy.options.buildPath || './dist')

      fs.stat(dist, (err, stat) => {
        const filesInfo = (() => {
          if (err || !stat.isDirectory)
            return []

          else
            return utils.readFiles(dist).map(filepath => (
              new Promise((resolve, reject) => {
                fs.readFile(filepath, (err, data) => {
                  if (err) {
                    console.log('\u001b[31m> Client error: Failed to read file: ' + filepath + '\u001b[39m')
                    throw err
                  }

                  resolve({ filepath, content: utils.md5(data).toString() })
                })
              })
            ))
        })()

        Promise.all(filesInfo).then(files => {
          const result = {}
          files.forEach(({ filepath, content }) => result[content] = true)

          socket.write(signal.encode(
            signal.CLIENT_SYNC_FILES_MD5,
            Buffer.from(JSON.stringify(result))
          ))
        })
      })

      socket.write(signal.encode(signal.CLIENT_BUILD))
    }

    function handle(socket, { type, content, note }) {
      switch (type) {
        case signal.SERVER_BUILD_FILE_SYNC: return fileSync(socket, note.toString(), content)
      }
    }

    /**
     * 同步文件
     * @param {Socket} socket
     * @param {String} filepath 相对文件路径
     * @param {Buffer} content  文件内容
     */
    function fileSync(socket, filepath, content) {
      filepath = path.posix.resolve(utils.bsy.options.buildPath, filepath)

      utils.dirCheck(filepath, (err, stats) => {
        if (err) {
          console.log('\u001b[31m> Client error: Directory check failed.\u001b[39m')
          console.error(err)
          return
        }
  
        fs.writeFile(filepath, content, err => {
          if (err) {
            console.log('\u001b[31m> Client error: File write failed.\u001b[39m')
            console.error(err)
            return
          }
        })
      })
    }
  })
}
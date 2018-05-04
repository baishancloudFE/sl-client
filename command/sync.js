/**
 * 项目同步函数
 * @param {Function} supplement   handle 函数补充
 * @param {Function} syncCallback 项目同步完毕回调
 * @param {Function} codeCallback 本函数代码顺序执行完毕的回调
 */
module.exports = function (supplement, syncCallback, codeCallback) {
  _require('/lib/utils').then(({ bsy: { name: project, builder }, readFiles, uid, connect }) => {
    watch(connect(), supplement, syncCallback, codeCallback)
  })

  function watch(socket, supplement, syncCallback, codeCallback) {
    const path = require('path')

    Promise.all([
      _require('/lib/signal'),
      _require('/lib/NodeWatchFileSystem')
    ]).then(([signal, NodeWatchFileSystem]) => {
      const wfs = new NodeWatchFileSystem(socket)

      // 建连后与服务端同步项目
      socket.on('connect', init)
      socket.on('data', data => signal.decode(data).forEach(info => handle(socket, info)))

      codeCallback && codeCallback(wfs)

      /**
       * 初始化连接
       */
      function init() {
        socket.write(signal.encode(
          signal.CLIENT_INIT,
          Buffer.from(JSON.stringify({ uid, project, builder }))
        ))
      }

      /**
       * 接收信息处理
       * @param {Socket} socket
       * @param {Object} { type: 信号位, content: 传输内容, note: 附加信息 }
       */
      function handle(socket, {type, content, note}) {
        switch (type) {
          case signal.SERVER_INIT_DONE: return wfs.sync(readFiles(process.cwd(), /node_modules|dist|\.git/))
          case signal.SERVER_FILE_UPDATE: return wfs.fileUpdate(path.resolve(note.toString()), true)
          case signal.SERVER_CHECK_OFF: return syncCallback && syncCallback(socket)
          case signal.SERVER_CONSOLE: return console.log(content.toString())
          default: return supplement && supplement(socket, {type, content, note})
        }
      }
    })
  }
}

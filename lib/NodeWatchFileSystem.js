module.exports = (function() {
  const fs = require('fs')
  const path = require('path')
  const Watchpack = require('watchpack')
  const signal = require('./signal')
  const {md5} = require('./utils')
  
  const cwd = process.cwd()
  
  /**
   * 用于文件监听与同步
   */
  class NodeWatchFileSystem {
    constructor(socket) {
      const watcherOptions = { aggregateTimeout: 0 }
  
      this.socket = socket
      this.watcherOptions = watcherOptions
      this.watcher = new Watchpack(watcherOptions)
    }
  
    watch(files, dirs, startTime, options, callback, callbackUndelayed) {
      if (!Array.isArray(files))
        throw new Error("Invalid arguments: 'files'")
      if (!Array.isArray(dirs))
        throw new Error("Invalid arguments: 'dirs'")
      if (typeof callback !== "function" && callback)
        throw new Error("Invalid arguments: 'callback'")
      if (typeof startTime !== "number" && startTime)
        throw new Error("Invalid arguments: 'startTime'")
      if (typeof options !== "object")
        throw new Error("Invalid arguments: 'options'")
      if (typeof callbackUndelayed !== "function" && callbackUndelayed)
        throw new Error("Invalid arguments: 'callbackUndelayed'")
  
      const oldWatcher = this.watcher
      this.watcher = new Watchpack(options)
  
      if (callbackUndelayed)
        this.watcher.on("change", callbackUndelayed)
  
      this.watcher.on("aggregated", (changes, removals) => {
        changes = changes.filter(filepath => filepath !== path.resolve('src'))
        removals = removals.filter(filepath => filepath !== path.resolve('src'))
  
        this.purge(changes, removals)
        callback(null, changes, removals)
      })
  
      this.watcher.watch(files, dirs, startTime)
  
      if (oldWatcher)
        oldWatcher.close()
  
      return {
        close: () => {
          if (!this.watcher) return
  
          this.watcher.close()
          this.watcher = null
        },
  
        pause: () => {
          if (this.watcher)
            this.watcher.pause()
        }
      }
    }
  
    /**
     * 整理变更文件
     * @param {Array[String]} changes
     * @param {Array[String]} removals
     */
    purge(changes, removals) {
      changes.forEach(this.fileUpdate.bind(this))
  
      removals.forEach(filepath => {
        const content = signal.encode(
          signal.CLIENT_FILE_DELETE,
          null,
          Buffer.from(path.relative(cwd, filepath))
        )
  
        this.socket.write(content)
      })
    }
  
    /**
     * 与服务端同步文件
     * @param {Array[String]} filelist 文件路径列表
     */
    sync(filelist) {
      // 先告知服务端检查文件数目，以便得知项目是否检查完成
      this.socket.write(signal.encode(signal.CLIENT_NUMBER_OF_CHECK_FILES, Buffer.from('' + filelist.length)))
  
      filelist.forEach(filepath => fs.readFile(filepath, (err, file) => {
        if (err) return console.warn(err)
  
        const relativePath = Buffer.from(path.relative(cwd, filepath))
        const info = md5(file)
        const content = signal.encode(signal.CLIENT_FILE_CHECK, info, relativePath)
  
        this.socket.write(content)
      }))
    }
  
    /**
     * 文件更新
     * @param {String} filepath 文件路径
     * @param {Boolean} isSync  是否是初始化同步项目
     */
    fileUpdate(filepath, isSync) {
      fs.readFile(filepath, (err, file) => {
        if (err) return console.error(err)
  
        const content = signal.encode(
          isSync ? signal.CLIENT_FILE_SYNC : signal.CLIENT_FILE_CHANGE,
          file,
          Buffer.from(path.relative(cwd, filepath))
        )
  
        this.socket.write(content)
      })
    }
  }

  return NodeWatchFileSystem
})()

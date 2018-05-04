/**
 * 信号协议
 * 去除开始结束位后
 * 第一位为信号位，代表本次的数据传输的意图
 * 第二位开始至分隔符之间为附加信息，用以传递额外的信息内容
 * 分隔符后的内容为主体信息
 */
module.exports = (function (){
  const START = Buffer.from([0x12, 0x23, 0x33])
  const END = Buffer.from([0xAB, 0xCD, 0xEF])
  const JOINT = Buffer.concat([END, START])
  const BOUNDARY = Buffer.from([0x10, 0x03])
  const MAX = 5 // 限制文件大小 5MB
  const MAX_INFO_SIZE = MAX * 1024 * 1024
  
  const _exports = {}
  // 客户端信号
  _exports.CLIENT_INIT = Buffer.from([0x00])
  _exports.CLIENT_FILE_CHANGE = Buffer.from([0x01])
  _exports.CLIENT_FILE_DELETE = Buffer.from([0x02])
  _exports.CLIENT_FILE_CHECK = Buffer.from([0x03])
  _exports.CLIENT_FILE_SYNC = Buffer.from([0x04])
  _exports.CLIENT_NUMBER_OF_CHECK_FILES = Buffer.from([0x05])
  _exports.CLIENT_DEVELOPMENT = Buffer.from([0x06])
  _exports.CLIENT_BUILD = Buffer.from([0x07])
  _exports.CLIENT_SYNC_FILES_MD5 = Buffer.from([0x08])
  
  // 服务端信号
  _exports.SERVER_INIT_DONE = 0xFF
  _exports.SERVER_FILE_UPDATE = 0xFE
  _exports.SERVER_CHECK_OFF = 0xFD
  _exports.SERVER_DEV_SERVER_START = 0xFC
  _exports.SERVER_BUILD_FILE_SYNC = 0xFB
  _exports.SERVER_CONSOLE = 0xBB
  
  // 数据缓存，避免太大的文件传输时被分割成多个片段
  let cache = Buffer.from('')
  
  /**
   * 解码
   * @param  {Buffer} data
   * @return {Array[Object[Buffer]]} { type: 信号位, content: 传输内容, note: 附加信息 }
   */
  _exports.decode = function (data) {
    return split(data).map(decode).filter(data => !data.incomplete)
  }
  
  /**
   * 编码
   * @param {Buffer} signal  信号位
   * @param {Buffer} content 传输内容
   * @param {Buffer} note    附加信息
   */
  _exports.encode = function (signal, content, note) {
    if (!Buffer.isBuffer(signal))
      throw new TypeError('signal must be a Buffer.')
  
    content = Buffer.isBuffer(content) ? content : Buffer.from('')
    note = Buffer.isBuffer(note) ? note : Buffer.from('')
  
    // 3个长度位、1个信号位
    const length = START.length + 3 + 1 + note.length + BOUNDARY.length + content.length + END.length
    const length_x16 = zeroFillBuffers(length.toString(16), 6)
    const length_buf = Buffer.alloc(3)
  
    if (MAX_INFO_SIZE < length) {
      console.error(`Transmission content size more than ${MAX}MB`)
      return {}
    }
  
    length_buf[0] = parseInt(length_x16.slice(0, 2), 16)
    length_buf[1] = parseInt(length_x16.slice(2, 4), 16)
    length_buf[2] = parseInt(length_x16.slice(4), 16)
  
    return Buffer.concat([START, length_buf, signal, note, BOUNDARY, content, END])
  }
  
  /**
   * 按协议分割数据
   * @param {Buffer} data 数据串
   */
  function split(data) {
    const result = []
  
    cut(data, result)
    return result
  
    /**
     * 单次分割
     * @param {Buffer} data 数据串
     * @param {Array}  result
     */
    function cut(data, result) {
      const index = data.indexOf(JOINT)
  
      if (index === -1) return result.push(data)
  
      const slice = data.slice(0, index + END.length)
      const surplus = data.slice(index + END.length)
  
      result.push(slice)
      cut(surplus, result)
    }
  }
  
  /**
   * 解码
   * @param {Buffer} data
   * @return {Object[Buffer]} { type: 信号位, content: 传输内容, note: 附加信息 }
   */
  function decode(data) {
    // 拼接数据
    cache = Buffer.concat([cache, data])
  
    // 如果数据不完全，继续与下一段数据拼接
    if (
      !START.equals(cache.slice(0, 3)) ||
      !END.equals(cache.slice(cache.length - 3))
    ) return { data, incomplete: true }
  
    // 开始处理
    const type = cache[6]
    const length = parseInt(cache.slice(3, 6).reduce((result, next) => result.toString(16) + next.toString(16)), 16)
  
    // 传输内容超过限制
    if (MAX_INFO_SIZE < length) {
      console.warn(`transmission content size more than ${MAX}MB`)
      return { cache, incomplete: true }
    }
  
    cache = cache.slice(7, cache.length - 3)
    const index = cache.indexOf(BOUNDARY)
    const note = cache.slice(0, index)
    const content = cache.slice(index + BOUNDARY.length)
  
    // 清空缓存
    cache = Buffer.from('')
  
    return { type, content, note }
  }
  
  /**
   * 零比特填充
   * @param {String} content  数据内容
   * @param {Number} length   总长度
   */
  function zeroFillBuffers(content, length) {
    while (content.length < length)
      content = '0' + content
  
    return content
  }
  
  /**
   * #### 测试用函数 ####
   * 
   * Buffer 转 String
   * @param  {Buffer} buffer
   * @return {String}
   */
  function bufferToString(buffer) {
    const chunk = []
    buffer.forEach(byte => chunk.push(byte.toString(16)))
    chunk.push('\n')
    return chunk.join(' ')
  }

  return _exports
})()
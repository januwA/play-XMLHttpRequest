let ajanuw; {
  let l = console.log

  /**
   * 范湖一个 XML对象
   */
  function getXMLHttpRequest() {
    if (window.XMLHttpRequest) {
      return new window.XMLHttpRequest;
    } else {
      try {
        return new ActiveXObject("MSXML2.XMLHTTP.3.0");
      } catch (ex) {
        return null;
      }
    }
  }

  /**
   * 一些工具处理函数
   */
  function Util() {};

  Util.handleUrl = function (uri, url) {
    // 处理全局uri 和请求的url
    return uri ?
      uri.replace(/\/+$/, '') + '/' + url.replace(/^\/+/, '') :
      url;
  }

  Util.handleData = function (data) {
    return data ?
      Util.jsonToSerializ(data) :
      data;
  }

  Util.jsonToSerializ = function (o = {}) {
    let s = '';
    for (let k in o) {
      let v = o[k];
      let vTag = Object.prototype.toString.call(v);
      if (vTag === '[object Array]') {
        for (let i of v) {
          s += `${k}=${encodeURIComponent(i)}&`
        }
      } else if (vTag === '[object Object]') {
        s += `${k}=${encodeURIComponent(JSON.stringify(v))}&`
      } else {
        s += `${k}=${encodeURIComponent(v)}&`
      }
    }
    return s.replace(/&$/, '');
  }

  Util.handleUrlQuery = function (uri, url, query) {
    // 把get请求的query拼接到url里面，返回url
    let res_url;
    if (query) {
      if (url.split(/\?/)[1]) {
        res_url = Util.handleUrl(uri, url) + '&' + query;
      } else {
        res_url = Util.handleUrl(uri, url) + '?' + query;
      }
    } else {
      res_url = Util.handleUrl(uri, url);
    }
    return res_url;
  }

  Util.tostring = function (v) {
    return Object.prototype.toString.call(v);
  }

  var ignoreDuplicateOf = [
    'age', 'authorization', 'content-length', 'content-type', 'etag',
    'expires', 'from', 'host', 'if-modified-since', 'if-unmodified-since',
    'last-modified', 'location', 'max-forwards', 'proxy-authorization',
    'referer', 'retry-after', 'user-agent'
  ];

  Util.handleHeaders = function (headers_string) {
    // handling xhr returned headers
    if (!headers_string) return {};
    return headers_string.split(/\n/)
      .filter(el => el !== '')
      .reduce((acc, $_) => {
        let [k, v] = $_.split(/\:/);
        k = k.trim().toLowerCase();
        v = v.trim();
        if (k) {
          if (acc[k] && ignoreDuplicateOf.indexOf(k) >= 0) return acc;
          if (k === 'set-cookie') {
            acc[k] = (acc[k] ? acc[k] : []).concat([v]);
          } else {
            acc[k] = acc[k] ?
              acc[k] + ',' + v :
              v;
          }
        }
        return acc;
      }, {});
  }

  /**
   * * 实例化一个请求
   * @param {*} config 
   */
  function Ajanuw(config = {}) {
    this.CONFIG = config;

    /**
     * * 更具配置返回一个新的xml对象
     * @param {*} opt 
     */
    this.create = function (opt) {
      return new Ajanuw(new Config(opt))
    }

    /**
     * * ajax 的get方法
     * @param {*} url 
     * @param {*} opt 
     */
    this.get = function (url, opt = {}) {
      return this.request('GET', url, opt)
    }

    /**
     * * ajax的 post方法
     * @param {*} url 
     * @param {*} opt 
     */
    this.post = function (url, opt = {}) {
      return this.request('POST', url, opt)
    }

    /**
     * * 所欲的ajax请求都基于这个对象
     * @param {*} method 
     * @param {*} url 
     * @param {*} opt 
     */
    this.request = function (method, url, opt = {}) {

      /**
       * * name属性用来给一个请求定义一个名字，用于追踪这个请求，好abort它
       */
      let name = opt.name;

      /**
       * * 获取一个 xml
       */
      let xhr = getXMLHttpRequest();
      if (!xhr) return;

      /**
       * * 创建一个 promise对象
       */
      let resolve, reject, p;
      p = new Promise((res, rej) => {
        resolve = res, reject = rej;
      })

      /**
       * * 区分ajax是否有 name
       */
      if (name) {
        if (name in Ajanuw.REQS) {
          xhr = null;
          reject(
            '请求创建失败，' +
            '请求' + name +
            ' 已经存在！'
          );
        } else {
          Ajanuw.REQS[name] = xhr;
        }
      } else {
        // l('没有name，不跟踪这个请求') // 不能被abort
      }


      /**
       * * 处理请求所需的 url
       */
      let query = Util.handleData(opt.query);
      url = Util.handleUrlQuery(this.CONFIG.uri, url, query);

      /**
       * * 构建一个请求
       * (xml, { method, url, async, opt, name}, global_config, our_promise)
       */
      return new Request(xhr, {
        method: method.toUpperCase(),
        url,
        async: true,
        ...opt,
        name
      }, this.CONFIG, {
        result: p,
        resolve,
        reject
      })
    }
  }

  Ajanuw.REQS = {}

  /**
   * 根据传入的 name属性，停止指定的请求，返回promise
   * @param {*} name 
   * @param {*} msg 
   * 
   *  ajanuw.abort('test', '立即结束 text请求').then(res => {
        l('结束成功', res)
      })
   */
  Ajanuw.prototype.abort = function (name, msg) {
    return new Promise((resolve, reject) => {
      if (name in Ajanuw.REQS) {
        Ajanuw.REQS[name].msg = msg;
        Ajanuw.REQS[name].abort();
        delete Ajanuw.REQS[name]; // 成功停止，移除这个请求
        resolve('OK');
      } else {
        reject('Not Found')
      }
    })
  };

  /**
   * * 所有的请求都再这里处理
   * @param {*} xhr 
   * @param {*} opt 
   * @param {*} config 
   * @param {*} promise 
   */
  function Request(xhr, opt, config, promise) {

    /**
     * method  请求方法 get post ...
     * url 请求地址如: http://localhost:5000async
     * async  是否用异步处理请求 default: true
     * set  请求所需要的请求头 {X-name: 'ajanuw'}
     * timeout  请求超时如 2s: 2000
     * resType  指定请求返回什么数据: json text arraybuffer document ...
     */
    const {
      method,
      url,
      async,
      set,
      timeout,
      resType,
      name,
      upload,
    } = opt;

    /**
     * * upload
     * * progress,loadstart,error,abort,timeout,load,loadend
     */
    if (upload) {
      let eNames = 'progress,loadstart,error,abort,timeout,load,loadend'.split(/,/)
      for (let eName in upload) {
        if(!eNames.includes(eName)) continue;
        l(eName)
        xhr.upload['on' + eName] = e => {
          if (eName === 'progress') {
            if (e.lengthComputable) {
              var percentage = Math.round((e.loaded * 100) / e.total);
              upload[eName](percentage)
            }
          } else {
            upload[eName](e)
          }
        }
      }
    }


    xhr.open(method, url, async); // https://msdn.microsoft.com/zh-cn/ie/ms536648(v=vs.80)


    /**
     * 设置头信息
     * 如果是post请求，还是json数据，自动添加 application/x-www-form-urlencoded
     */
    const dataTag = Util.tostring(opt.body)
    if (method === 'POST' && dataTag === '[object Object]') { // object会序列化为DONString
      xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    }

    /**
     * * 先合并全局的header和请求时设置的header
     * * 继续加header头
     */
    Object.assign(config.headers, set)
    if (config.headers) {
      let {
        headers
      } = config;
      for (let k in headers) {
        xhr.setRequestHeader(k, headers[k])
      }
    }

    /**
     * 设置 timeout
     * opt.timeout > config.timeout
     */
    if (timeout) {
      xhr.timeout = timeout;
    } else {
      xhr.timeout = config.timeout;
    }

    /**
     * 设置服务器返回的数据类型
     * 默认json
     */
    xhr.responseType = resType || config.resType;
    // if (xhr.overrideMimeType) xhr.overrideMimeType('text/json');

    /**
     * * 设置 send时的数据
     */
    let requestData = null;
    if (method === 'POST' && dataTag === '[object Object]') {
      requestData = Util.jsonToSerializ(opt.body);
    } else {
      requestData = opt.body;
    }

    xhr.send(requestData); // https://msdn.microsoft.com/zh-cn/ie/ms536736(v=vs.80)

    /**
     * 超时请求结束
     */
    xhr.ontimeout = () => {
      promise.reject({
        type: 'timeout',
        msg: '请求超时: ' + url
      })
      xhr = null
    }

    xhr.onloadstart = e => {
      l('请求开始')
    }

    // xhr.onprogress = e => {
    //   // l('请求进度')
    // }

    xhr.error = e => {
      l('请求发生错误')
      xhr = null
    }

    xhr.loadend = e => {
      xhr = null
    }

    /**
     * * 请求被手动结束
     */
    xhr.onabort = () => { // https://msdn.microsoft.com/zh-cn/ie/ms535920(v=vs.80)
      if (!xhr) return;
      promise.reject({
        type: 'abort',
        msg: xhr.msg
      })
      xhr = null
    }

    xhr.onreadystatechange = e => { // https://msdn.microsoft.com/zh-cn/ie/dd576252(v=vs.80)
      // Doncs: https://xhr.spec.whatwg.org/#xmlhttprequest
      if (!xhr || !xhr.responseURL || xhr.readyState !== xhr.DONE) return;
      if (!xhr || !xhr.responseURL || xhr.status === 0) return;

      let responseData = {
        data: xhr.response,
        response: xhr.response,
        responseURL: xhr.responseURL,
        readyState: xhr.readyState,
        status: xhr.status,
        statusText: xhr.statusText,
        responseType: xhr.responseType,
        timeout: xhr.timeout,
        withCredentials: xhr.withCredentials,
        responseHeaders: Util.handleHeaders(xhr.getAllResponseHeaders()),
      };

      if (!(xhr.status >= 200 && xhr.status <= 304)) {
        promise.reject({
          type: 'error',
          ...responseData
        })
        xhr = null;
        return promise.result
      }

      /**
       * * 请求结束, 数据放在 promise里面
       */
      promise.resolve(responseData)
      xhr = null
      if (name) {
        delete Ajanuw.REQS[name]
      }
    }

    /**
     * * request 结束返回 promise.result
     */
    return promise.result
  }

  /**
   * * 设置全局配置
   * @param { url: string, timeout: number, hedaers: Object, resTyle: string } config 
   */
  function Config(config = {}) {
    let {
      uri,
      timeout,
      headers,
      resType,
    } = config;

    this.uri = uri || ''
    this.timeout = timeout || 0
    this.headers = headers || {}
    this.resType = resType || 'json'
  }

  /**
   * ajanuw.get(url, {
   *   query: {},
   * }).then(({data}) => alert(data))
   *   .catch(e => alert(e))
   */
  window.ajanuw = ajanuw = new Ajanuw(new Config())
}
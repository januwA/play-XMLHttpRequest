let ajanuw; {
  let l = console.log

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

  function Util() {}
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

  function Ajanuw(config = {}) {
    this.CONFIG = config;
    this.REQS = {};

    this.create = function (opt) {
      return new Ajanuw(new Config(opt))
    }

    this.request = function (method, url, opt = {}) {
      let name = opt.name;
      let xhr = getXMLHttpRequest();
      if (!xhr) return;
      let resolve, reject, p;
      p = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
      })
      if (name) {
        if (name in this.REQS) {
          xhr = null;
          reject(
            '请求创建失败，' +
            '请求' + name +
            ' 已经存在！'
          );
        } else {
          this.REQS[name] = xhr;
        }
      } else {
        // l('没有name，不跟踪这个请求') // 不能被abort
      }
      let query = Util.handleData(opt.query);
      url = Util.handleUrlQuery(this.CONFIG.uri, url, query);
      // 
      return new Request(xhr, {
        method: method.toUpperCase(),
        url,
        async: true,
        ...opt,
      }, this.CONFIG, {
        result: p,
        resolve,
        reject
      })
    }
  }

  Ajanuw.prototype.abort = function (name, msg) {
    return new Promise((resolve, reject) => {
      if (name in this.REQS) {
        this.REQS[name].msg = msg;
        this.REQS[name].abort();
        delete this.REQS[name];
        resolve('OK');
      } else {
        reject('Not Found')
      }
    })
  };

  function Request(xhr, opt, config, promise) {
    const {
      method,
      url,
      async,
      set,
      timeout,
      resType
    } = opt;
    xhr.open(method, url, async); // https://msdn.microsoft.com/zh-cn/ie/ms536648(v=vs.80)
    /**
     * 设置头信息
     */
    const dataTag = Util.tostring(opt.body)
    if (method === 'POST' && dataTag === '[object Object]') { // object会被我序列化为DONString
      xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    }

    if (set) {
      for (let k in set) {
        xhr.setRequestHeader(k, set[k]);
      }
    }

    /**
     * 设置 timeout
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
    xhr.responseType = resType || '';
    // if (xhr.overrideMimeType) xhr.overrideMimeType('text/json');

    let requestData = null;
    if (method === 'POST' && dataTag === '[object Object]') {
      requestData = Util.jsonToSerializ(opt.body);
    } else {
      requestData = opt.body;
    }

    xhr.send(requestData); // https://msdn.microsoft.com/zh-cn/ie/ms536736(v=vs.80)

    xhr.ontimeout = e => {
      promise.reject({
        type: 'timeout',
        msg: '请求超时: ' + url
      });
      xhr = null
    }

    xhr.onloadstart = e => {
      l('请求开始')
    }

    xhr.onprogress = e => {
      l('请求进度')
    }

    xhr.error = e => {
      l('请求发生错误')
    }

    xhr.loadend = e => {
      l('请求结束')
    }

    xhr.onabort = e => { // https://msdn.microsoft.com/zh-cn/ie/ms535920(v=vs.80)
      if (!xhr) return;
      promise.reject({
        type: 'abort',
        msg: xhr.msg
      });
      xhr = null;
    }

    xhr.onreadystatechange = e => { // https://msdn.microsoft.com/zh-cn/ie/dd576252(v=vs.80)
      // Doncs: https://xhr.spec.whatwg.org/#xmlhttprequest
      if (!xhr || !xhr.responseURL || xhr.readyState !== xhr.DONE) return;
      if (!xhr || !xhr.responseURL || xhr.status === 0) return;

      if (resType && resType !== 'json') {

      }
      let data;
      try {
        data = JSON.parse(xhr.response)
      } catch (error) {
        data = xhr.response
      }
      let responseData = {
        data: xhr.response,
        response: xhr.response,
        responseURL: xhr.responseURL,
        readyState: xhr.readyState,
        timeout: xhr.readyState,
        status: xhr.status,
        statusText: xhr.statusText,
        responseType: xhr.responseType,
        timeout: xhr.timeout,
        withCredentials: xhr.withCredentials,
        responseHeaders: xhr.getAllResponseHeaders(),
      };

      if (!(xhr.status >= 200 && xhr.status <= 304)) {
        promise.reject({
          type: 'error',
          ...responseData
        })
        xhr = null;
        return
      }

      promise.resolve(responseData);
      xhr = null;
    }
    return promise.result;
  }

  function Config(config = {}) {
    let {
      uri,
      timeout
    } = config;
    this.uri = uri || '';
    this.timeout = timeout || 0;
  }

  window.ajanuw = ajanuw = new Ajanuw(new Config())
}
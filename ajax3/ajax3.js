{
  ///////////
  let l = console.log

  function Ajanuw(config) {
    /* ajax */
    this.CONFIG = config;
  }

  function Util() { /* 工具函数库 */ }
  Function.prototype.method = function (name, fn) {
    this.prototype[name] = fn;
  }
  Function.prototype.attr = function (name, fn) {
    this[name] = fn;
  }


  Util.attr('serializeToJson', function (str = '') {
    return JSON.stringify(str.split('&').reduce((acc, elt) => {
      const index = elt.indexOf('=');
      const k = elt.substring(0, index);
      const v = encodeURIComponent(
        elt.substring(index + 1));
      return Object.assign(acc, {
        [k]: v
      });
    }, {}));
  });

  Util.attr('jsonToSerializ', function (o = {}) {
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
  });

  Util.attr('handleGetQuery', function (r, query, CONFIG) {
    // 把get请求的query拼接到url里面，返回url
    let url;
    let uri = CONFIG.uri;
    if (query) {
      if (r.split(/\?/)[1]) {
        url = Util.handleUrl(uri, r) + '&' + query;
      } else {
        url = Util.handleUrl(uri, r) + '?' + query;
      }
    } else {
      url = Util.handleUrl(uri, r);
    }
    return url;
  });

  Util.attr('handleData', function (query) { // 处理get,post发送的数据
    return query ?
      Util.jsonToSerializ(query) :
      query;
  });

  Util.attr('handleUrl', function (uri, url) { // 处理全局uri 和请求的url
    let base = uri
    return base ?
      base.replace(/\/+$/, '') + '/' + url.replace(/^\/+/, '') :
      url;
  });

  function Config(config = {}) {
    let {
      uri,
      timeout
    } = config;
    this.uri = uri || 'http://localhos:3000';
    this.timeout = timeout || 0;
  }

  function Get(r, opt = {}, RP = true, CONFIG = {}) { // 请求默认返回promise
    let res, rej;
    let p = new Promise((resolve, reject) => {
      res = resolve;
      rej = reject;
    });

    if (opt.name) this.name = opt.name;
    let xhr = new XMLHttpRequest();
    // this.xhr = xhr;

    xhr.onreadystatechange = () => {
      // 关于XMLHttpRequest.DONE
      // Doncs: https://xhr.spec.whatwg.org/#xmlhttprequest
      if (!xhr || xhr.readyState !== XMLHttpRequest.DONE) return;

      // 404 或其他情况
      // l(xhr.statusText)
      if (xhr.responseURL && xhr.statusText !== 'OK' /*&& !(xhr.status >= 200 && xhr.status < 300)*/ ) {
        rej(xhr);
        xhr = null;
      }

      let obj = xhr;
      let resHeaders = xhr.getAllResponseHeaders();
      let data = xhr.response;
      obj['responseHeaders'] = resHeaders;
      obj['data'] = data;
      res(obj);
      xhr = null;
    }

    let query = Util.handleData(opt.query); // 处理数据
    let url = Util.handleGetQuery(r, query, CONFIG); // query拼到url里面

    let async = true;
    if (opt.async !== undefined && (typeof opt.async === 'boolean')) {
      async = opt.async;
    }
    xhr.open('GET', url, async);
    // 设置request header
    let headers = opt.set || {};
    for (let k in headers) xhr.setRequestHeader(k, headers[k]);

    if (async === true) {
      // 设置timeout，没有的话就用全局的imeout
      if (opt.timeout) {
        xhr.timeout = opt.timeout;
      } else {
        xhr.timeout = CONFIG.timeout;
      }

      // 强制设置服务器返回数据的类型
      // 默认json，其他数据自行设置
      // "arraybuffer", "blob", "document", "json", and "text".
      xhr.responseType = opt.resType || 'json';
    }

    xhr.onabort = (e) => {
      xhr = null;
    }
    setTimeout(() => {
      if (!xhr || this.abort === undefined) return;
      rej({
        type: 'abort',
        state: this.abort
      });
      xhr.abort()
      xhr = null;
    });

    xhr.send(null);
    return {
      p,
      xhr: this
    }
  }

  Ajanuw.method('create', function (opt = {}) {
    /**
     * 每个 create 都会返回不同的实例
     */
    return new Ajanuw(new Config(opt))
  });

  Ajanuw.method('get', function (url, opt, RP) {
    return new Get(url, opt, RP, this.CONFIG);

  })


  Ajanuw.method('post', function () {
    l('post请求')
    return this;
  });


  function Request(method, url, opt) {

  }
  Ajanuw.method('request', function (method, url, opt) {
    return new Request(method, url, opt)
  })


  window.ajanuw = new Ajanuw()
  /////////
}
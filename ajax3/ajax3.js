{
  ///////////
  let l = console.log
  let abort = {};

  function Ajanuw() { /* ajax */ }
  let CONFIG; // 全局配置
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

  Util.attr('handleGetQuery', function (r, query) {
    // 把get请求的query拼接到url里面，返回url
    let url;
    if (query) { // 处理 url
      if (r.split(/\?/)[1]) {
        url = Ajanuw.handleUrl(r) + '&' + query;
      } else {
        url = Ajanuw.handleUrl(r) + '?' + query;
      }
    } else {
      url = Ajanuw.handleUrl(r);
    }
    return url;
  })

  Ajanuw.handleData = function (query) { // 处理get,post发送的数据
    return query ?
      Util.jsonToSerializ(query) :
      query;
  }

  Ajanuw.handleUrl = function (url) { // 处理全局uri 和请求的url
    let base = CONFIG.uri
    return base ?
      base.replace(/\/+$/, '') + '/' + url.replace(/^\/+/, '') :
      url;
  }

  function Config(config = {}) {
    let {
      uri,
      timeout
    } = config;
    this.uri = uri || 'http://localhos:3000';
    this.timeout = timeout || 0;
  }

  function Get(r, opt = {}, RP = true) { // 请求默认返回promise
    let res, rej;
    let p = new Promise((resolve, reject) => {
      res = resolve;
      rej = reject;
    });

    let xhr = new XMLHttpRequest();
    this.xhr = xhr;

    xhr.onreadystatechange = () => {
      // 关于XMLHttpRequest.DONE
      // Doncs: https://xhr.spec.whatwg.org/#xmlhttprequest
      if (xhr.readyState === XMLHttpRequest.DONE) {
        if (xhr.status >= 200 && xhr.status < 300) {
          let obj = xhr;
          let resHeaders = xhr.getAllResponseHeaders();
          let data = xhr.response;
          obj['responseHeaders'] = resHeaders;
          obj['data'] = data;
          if (RP === true) {
            res(obj);
          } else {
            this._ok(obj);
          }
        } else {
          if (RP === true) {
            rej(xhr)
          } else {
            // error(xhr)
          }
        }
      }
    }

    let query = Ajanuw.handleData(opt.query); // 处理数据
    let url = Util.handleGetQuery(r, query); // query拼到url里面

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



    // xhr.setRequestHeader('content-type', 'application/x-www-form-urlencoded')
    xhr.send(null);
    if (opt.name) this.name = opt.name;
    setTimeout(() => {
      if (abort.name && abort.name === this.name) {
        if (abort.fn) {
          return abort.fn(xhr);
        }else{
          xhr.abort();
        }
      }
    });
    if (RP === true) {
      return p;
    } else {
      return this;
    }
  }

  Get.method('ok', function (fn) {
    this._ok = fn;
    return this;
  })



  Ajanuw.method('abort', function (name, fn) {
    abort.name = name;
    if (fn) {
      abort.fn = fn;
    }
  })

  Ajanuw.method('create', function (opt = {}) {
    CONFIG = new Config(opt);
    return new Ajanuw()
  });

  Ajanuw.method('get', function (url, opt, RP) {
    return new Get(url, opt, RP)
  })


  Ajanuw.method('post', function () {
    l('post请求')
    return this;
  });


  window.ajanuw = new Ajanuw()
  /////////
}
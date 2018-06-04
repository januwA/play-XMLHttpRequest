(function (f) {

  if (typeof exports === 'object' && typeof module !== 'undefined') {
    // cmd
    module.exports = f
  } else if (typeof define === 'function' && define.amd) {
    // amd
    define([], f)
  } else {
    // 没有模块环境
    let g;
    if (typeof window !== "undefined") {
      g = window
    } else if (typeof global !== "undefined") {
      g = global
    } else if (typeof self !== "undefined") {
      g = self
    } else {
      g = this;
    }
    g.ajanuw = f()
  }
})(function () {

  const l = console.log;
  let xhr = new XMLHttpRequest();
  let errorEvent = 'onerror',
    loadEvent = ('onload' in xhr) ? 'onload' : 'onreadstatechange',
    loadstartEvent = 'onloadstart',
    loadendEvent = 'onloadend',
    progressEvent = 'onprogress',
    timeoutEvent = 'ontimeout',
    abortEvent = 'onabort';

  function Ajanuw() {}

  Ajanuw.serializeToJson = function (str = '') {
    /**
        let s = "name=ajanuw&age=22&doc=23123=0000"
        serializeToJson(s) -> {"name":"ajanuw","age":"22","doc":"23123%3D0000"}
       */
    return JSON.stringify(str.split('&').reduce((acc, elt) => {
      const index = elt.indexOf('=');
      const k = elt.substring(0, index);
      const v = encodeURIComponent(
        elt.substring(index + 1));
      return Object.assign(acc, {
        [k]: v
      });
    }, {}));
  }

  Ajanuw.jsonToSerializ = function (obj = {}) {
    // jsonToSerialize({name:'ajanuw',age:23}) -> name=ajanuw&age=23
    let s = '';
    for (const el in obj) {
      s += `${el}=${obj[el]}&`
    }
    return s.replace(/&$/, '');
  }
  Ajanuw.handleQuery = function (query) {
    return query ?
      Ajanuw.jsonToSerializ(query) :
      query;
  }
  Ajanuw.handleUrl = function (url) {
    return url;
  }
  Ajanuw.prototype = {
    init: function () {
      this._xhr = xhr;
      this._next = null; // ok 钩子
      this._abort = null; // 请求退出钩子
      this._loadstart = null; // 请求开始钩子
      this._progress = null; // 请求进度钩子
      this._loadend = null; // 请求结束钩子
      this._timeout = null; // 请求超时钩子
      this._error = null; // 请求发生错误钩子
      return this;
    },

    create: function (opt) {
      l('初始化配置', opt)
      return this;
    },

    get: function (r, opt) {

      let query = Ajanuw.handleQuery(opt.query);
      let url;

      if (query) {
        if (r.split(/\?/)[1]) {
          url = Ajanuw.handleUrl(r) + '&' + query;
        } else {
          url = Ajanuw.handleUrl(r) + '?' + query;
        }
      } else {
        url = Ajanuw.handleUrl(r);
      }

      xhr[loadEvent] = () => {
        if (xhr.readyState === XMLHttpRequest.DONE) {
          if (xhr.status >= 200 && xhr.status < 300) {
            let data = xhr.response;
            let res = xhr;
            res.data = data;
            if (this._next) {
              this._next(res);
            }
          }
        }
      }

      xhr.open('GET', url, true);
      // 设置request header
      let headers = opt.headers || {};
      for (let k in headers) {
        xhr.setRequestHeader(k, headers[k]);
      }

      // 设置timeout
      if (opt.timeout) {
        xhr.timeout = opt.timeout;
      }

      // 强制设置服务器返回数据的类型
      if (opt.responseType) {
        xhr.responseType = opt.responseType;
      }
      if (xhr.overrideMimeType) xhr.overrideMimeType('text/json');


      // 各种钩子
      xhr[abortEvent] = (abort) => {
        if (this._abort) {
          this._abort(abort);
        }
      }
      xhr[loadstartEvent] = (start) => {
        setTimeout(() => {
          if (this._loadstart) {
            this._loadstart(start)
          }
        })
      }
      xhr[progressEvent] = (progress) => {
        if (this._progress) {
          this._progress(progress);
        }
      }
      xhr[loadendEvent] = (loadend) => {
        if (this._loadend) {
          this._loadend(loadend);
        }
      }
      xhr[timeoutEvent] = (timeout) => {
        if (this._timeout) {
          this._timeout(timeout);
        }
      }
      xhr[errorEvent] = (error) => {
        if (this._error) {
          this._error(error);
        }
      }
      xhr.send(null)
      return this;
    },

    post: function (url, opt) {
      l('调用post请求')
      return this;
    },

    ok: function (nextHandle) {
      // 设置请求成功的回调函数
      this._next = nextHandle;
      return this;
    },

    abort: function (abortHandle) {
      this._abort = abortHandle;
      return this;
    },

    loadstart: function (loadstartHandle) {
      this._loadstart = loadstartHandle;
      return this;
    },

    progress: function (progressHandle) {
      this._progress = progressHandle;
      return this;
    },

    loadend: function (loadendHandle) {
      this._loadend = loadendHandle;
      return this;
    },

    timeout: function (timeoutHandle) {
      this._timeout = timeoutHandle;
      return this;
    },

    error: function (errorHandle) {
      this._error = errorHandle;
      return this;
    }

  }

  Ajanuw.prototype.init.prototype = Ajanuw.prototype;

  return function () {
    return new Ajanuw.prototype.init()
  }()
});
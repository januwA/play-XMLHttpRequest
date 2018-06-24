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
  const _tostring = (v) => Object.prototype.toString.call(v);
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

  Ajanuw.jsonToSerializ = function (o = {}) {
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
  Ajanuw.handleData = function (query) {
    return query ?
      Ajanuw.jsonToSerializ(query) :
      query;
  }
  Ajanuw.handleUrl = function (url) {
    let base = Ajanuw.config.uri
    return base ?
      base.replace(/\/+$/, '') + '/' + url.replace(/^\/+/, '') :
      url;
  }

  Ajanuw.prototype = {
    init: function () {
      // this._xhr = xhr; // 整个 xhr
      this._ok = null; // ok 钩子
      this._abort = null; // 请求退出钩子
      this._loadstart = null; // 请求开始钩子
      this._progress = null; // 请求进度钩子
      this._loadend = null; // 请求结束钩子
      this._timeout = null; // 请求超时钩子
      this._error = null; // 请求发生错误钩子
      return this;
    },

    create: function (opt = {}) { // 全局默认配置
      Ajanuw.config = opt;
      return this;
    },

    hook: function (opt = {}) { // 全局默认钩子，会和单独请求的钩子一起执行
      // {ok,timeout,error,progress,abort,loadstart,loadend}
      Ajanuw.hook = opt;
      return this;
    },

    get: function (r, opt, isReturnPromsie = true) {
      let resData, rejData;
      const P = new Promise((resolve, reject) => {
        resData = resolve;
        rejData = reject;
      });
      let query = Ajanuw.handleData(opt.query); // get请求的query数据
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

            let notHook;
            if (opt.hook) notHook = opt.hook.includes('ok'); // 禁用全局钩子
            if (notHook) {
              if (this._ok) {
                this._ok(res)
              } else if (isReturnPromsie) {
                resData(res)
              }
            } else {
              if (this._ok && Ajanuw.hook.ok) {
                this._ok(res), Ajanuw.hook.ok(res);
              } else if (isReturnPromsie && Ajanuw.hook.ok) {
                resData(res), Ajanuw.hook.ok(res);
              } else if (this._ok) {
                this._ok(res);
              } else if (Ajanuw.hook.ok) {
                Ajanuw.hook.ok(res);
              } else if (isReturnPromsie) {
                resData(res)
              }
            }

          }
        }
      }

      xhr.open('GET', url, true);
      // 设置request header
      let headers = opt.set || {};
      for (let k in headers) {
        xhr.setRequestHeader(k, headers[k]);
      }

      // 设置timeout，没有的话就用全局的imeout
      if (opt.timeout) {
        xhr.timeout = opt.timeout;
      } else if (Ajanuw.config.timeout) {
        xhr.timeout = Ajanuw.config.timeout;
      }

      // 强制设置服务器返回数据的类型
      // 默认json，其他数据自行设置
      xhr.responseType = opt.resType || 'json';
      if (xhr.overrideMimeType) xhr.overrideMimeType('text/json');


      // 各种钩子
      xhr[abortEvent] = (abort) => {
        let notHook;
        if (opt.hook) notHook = opt.hook.includes('abort');
        l(notHook)
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
        } else if (isReturnPromsie) {
          rejData(error)
        }
      }
      xhr.send(null);
      if (isReturnPromsie) { // 默认返回promise，设置false返回钩子
        return P;
      } else {
        return this;
      }
    },

    post: function (r, opt, isReturnPromsie = true) {
      let resData, rejData;
      const P = new Promise((resolve, reject) => {
        resData = resolve;
        rejData = reject;
      });
      let query = Ajanuw.handleData(opt.query); // post请求设置query查询数据
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

      let data = opt.body || {}; // post主体数据
      let dataTag = _tostring(data);
      /**
       * 判断post数据的类型，更具类型做处理，和设置一些header
       */
      if (dataTag === '[object Object]') {
        data = Ajanuw.handleData(data);
      } else if (dataTag === '[object FormData]') {
        data = data; // formData 的话就直接发送
      } else if (dataTag === '[object String]') {
        // 当为string的情况，可以传递一个form表单的id，或class，
        // 我会遍历里面的表单元素，转化为object发送给后台,
        // 表单有 media元素还请用 formData数据
        let f = document.querySelector(data);
        let toArray = Array.from;
        let body = {}
        scanDOM(f);

        function scanDOM(box) {
          let eles = toArray(box.children)
          for (let ele of eles) {
            if (ele.children.length && ele.nodeName !== 'SELECT' && ele.nodeName !== 'FIELDSET') { // select元素没有必要递归，表单包也暂时不用遍历
              scanDOM(ele)
            } else {
              let nodeName = ele.nodeName.toLowerCase();
              let formElementp = (v) => v === 'input' || v === 'select' || v === 'textarea' || v === 'fieldset';
              if (formElementp(nodeName)) { // 确认元素是表单元素
                if (ele.disabled === true) continue; // 如果元素为禁用则跳过
                let k, v;
                k = ele.name;
                if (!k) continue; // 没有name的表单元素跳过
                if (ele.type === 'radio') { // 单选按钮时，需要判断是否为选中状态
                  if (!ele.checked) continue;
                  v = ele.value;
                } else if (ele.type === 'checkbox') {
                  if (!ele.checked) continue;
                  v = ele.value;
                } else {
                  if (nodeName === 'select' && ele.multiple) {
                    let vs = []; // 收集所有多选状态下的 selected的value，
                    let options = toArray(ele.children);
                    for (let o of options) {
                      vs.push(o.value)
                    }
                    v = vs;
                  } else if (nodeName === 'fieldset') {
                    scanDOM(ele)
                  } else {
                    v = ele.value;
                  }
                }
                let alive = k in body;
                if (alive) { // 已经存在相应的name
                  let ov = body[k]
                  if (Object.prototype.toString.call(body[k]) === '[object Array]') {
                    body[k] = ov.concat(v)
                  } else {
                    body[k] = [ov, v]
                  }
                } else {
                  body[k] = v;
                }
              }

            }
          }
        }
        data = Ajanuw.handleData(body);
      }

      xhr[loadEvent] = () => {
        if (xhr.readyState === XMLHttpRequest.DONE) {
          if (xhr.status >= 200 && xhr.status < 300) {
            let data = xhr.response;
            let res = xhr;
            res.data = data;

            let notHook;
            if (opt.hook) notHook = opt.hook.includes('ok'); // 禁用全局钩子
            if (notHook) {
              if (this._ok) {
                this._ok(res)
              } else if (isReturnPromsie) {
                resData(res)
              }
            } else {
              if (this._ok && Ajanuw.hook.ok) {
                this._ok(res), Ajanuw.hook.ok(res);
              } else if (isReturnPromsie && Ajanuw.hook.ok) {
                resData(res), Ajanuw.hook.ok(res);
              } else if (this._ok) {
                this._ok(res);
              } else if (Ajanuw.hook.ok) {
                Ajanuw.hook.ok(res);
              } else if (isReturnPromsie) {
                resData(res)
              }
            }

          }
        }
      }

      xhr.open('POST', url, true);
      // 设置request header
      if (dataTag === '[object Object]' || dataTag === '[object String]') {
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
      }
      let headers = opt.set || {};
      for (let k in headers) {
        xhr.setRequestHeader(k, headers[k]);
      }

      // 设置timeout，没有的话就用全局的imeout
      if (opt.timeout) {
        xhr.timeout = opt.timeout;
      } else if (Ajanuw.config.timeout) {
        xhr.timeout = Ajanuw.config.timeout;
      }

      // 强制设置服务器返回数据的类型
      // 默认json，其他数据自行设置
      xhr.responseType = opt.resType || 'json';
      if (xhr.overrideMimeType) xhr.overrideMimeType('text/json');


      // 各种钩子
      xhr[abortEvent] = (abort) => {
        let notHook;
        if (opt.hook) notHook = opt.hook.includes('abort');
        if (notHook) {
          if (this._abort) {
            this._abort(abort);
          }
        } else {
          if (this._abort && Ajanuw.hook.abort) {
            this._abort(abort), Ajanuw.hook.abort(abort);
          } else if (this._abort) {
            this._abort(abort)
          } else if (Ajanuw.hook.abort) {
            Ajanuw.hook.abort(abort)
          }
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
        } else if (isReturnPromsie) {
          rejData(error)
        }
      }
      xhr.send(data);
      if (isReturnPromsie) {
        return P;
      } else {
        return this;
      }
    },

    ok: function (nextHandle) {
      // 设置请求成功的回调函数
      this._ok = nextHandle;
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
    },

    exit: function () {
      // 主动退出请求
      xhr.abort();
      return this;
    }

  }

  Ajanuw.prototype.init.prototype = Ajanuw.prototype;

  return function () {
    return new Ajanuw.prototype.init()
  }()
});
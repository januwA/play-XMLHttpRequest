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
  // let xhr = new XMLHttpRequest();
  let errorEvent = 'onerror',
    loadEvent = 'onload',
    loadstartEvent = 'onloadstart',
    loadendEvent = 'onloadend',
    progressEvent = 'onprogress',
    timeoutEvent = 'ontimeout',
    abortEvent = 'onabort';

  // 每个请求的钩子
  let hook = ['ok', 'abort', 'loadstart', 'progress', 'loadend', 'timeout', 'error'];

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
      hook.forEach(h => {
        this['_' + h] = null;
      });
      this.xhr = null;
      return this;
    },

    create: function (opt = {}) { // 全局默认配置
      Ajanuw.config = opt;
      return this;
      // return new Ajanuw.prototype.init()
    },

    hook: function (opt = {}) { // 全局默认钩子，会和单独请求的钩子一起执行
      // {ok,timeout,error,progress,abort,loadstart,loadend}
      Ajanuw.hook = opt;
      return this;
    },

    get: function (r, opt = {}, isReturnPromsie = true) {
      let xhr = new XMLHttpRequest();
      this.xhr = xhr;
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
            if (notHook || !!!(Ajanuw.hook && Ajanuw.hook.ok)) {
              if (this._ok && isReturnPromsie === false) {
                this._ok(res)
              } else if (isReturnPromsie === true) {
                resData(res)
              }
            } else {
              if ((this._ok && isReturnPromsie === false) && Ajanuw.hook && Ajanuw.hook.ok) {
                this._ok(res), Ajanuw.hook.ok(res);
              } else if (isReturnPromsie === true && Ajanuw.hook && Ajanuw.hook.ok) {
                resData(res), Ajanuw.hook.ok(res);
              } else if (this._ok && isReturnPromsie === false) {
                this._ok(res);
              } else if (Ajanuw.hook && Ajanuw.hook.ok) {
                Ajanuw.hook.ok(res);
              } else if (isReturnPromsie === true) {
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
      this.eventHook(xhr, resData, rejData, isReturnPromsie, opt.hook, [abortEvent, loadstartEvent, loadendEvent, progressEvent, errorEvent, timeoutEvent]);
      xhr.send(null);
      if (isReturnPromsie === true) { // 默认返回promise，设置false返回钩子
        return P;
      } else {
        return this;
      }
    },

    post: function (r, opt = {}, isReturnPromsie = true) {
      let xhr = new XMLHttpRequest();
      this.xhr = xhr;
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
            if (opt.hook) notHook = opt.hook.includes('ok'); // 禁用全局钩子?
            if (notHook || !!!(Ajanuw.hook && Ajanuw.hook.ok)) { // 禁用全局钩子，或者全局钩子更本不存在
              if (this._ok && isReturnPromsie === false) { // ok和then二选一
                this._ok(res)
              } else if (isReturnPromsie === true && this._ok) {
                resData(res)
              }
            } else {
              if ((this._ok && isReturnPromsie === false) && Ajanuw.hook && Ajanuw.hook.ok) {
                this._ok(res), Ajanuw.hook.ok(res);
              } else if (isReturnPromsie === true && Ajanuw.hook && Ajanuw.hook.ok) {
                resData(res), Ajanuw.hook.ok(res);
              } else if (this._ok && isReturnPromsie === false) {
                this._ok(res);
              } else if (Ajanuw.hook && Ajanuw.hook.ok) {
                Ajanuw.hook.ok(res);
              } else if (isReturnPromsie === true) {
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
      this.eventHook(xhr, resData, rejData, isReturnPromsie, opt.hook, [abortEvent, loadstartEvent, loadendEvent, progressEvent, errorEvent, timeoutEvent]);
      xhr.send(data);
      if (isReturnPromsie === true) {
        return P;
      } else {
        // return this;
        return new Ajanuw()
      }
    },

    eventHook: function (xhr, resData, rejData, isReturnPromsie, hook = [], hooks = []) {
      hooks.forEach(hookEvent => {
        // l(hook, hook.slice(2), '_' + hook.slice(2))
        let hookName = hookEvent.slice(2),
          _hookName = '_' + hookName;
        xhr[hookEvent] = e => {
          e['msg'] = this.msg || null;
          let notHook = false;
          if (hook) notHook = hook.includes(hookName);
          if (notHook) {
            if (hookName === 'loadstart') {
              setTimeout(() => {
                if (this[_hookName]) this[_hookName](e);
              });
            } else {
              if (hookName === 'error') {
                if (this[_hookName] && isReturnPromsie === false) {
                  this[_hookName](e)
                } else if (isReturnPromsie === true) {
                  rejData(e)
                }
              } else {
                if (this[_hookName]) this[_hookName](e);
              }
            }
          } else {
            if (hookName === 'loadstart') {
              setTimeout(() => {
                if ((this[_hookName] && isReturnPromsie === false) && Ajanuw.hook && Ajanuw.hook[hookName]) {
                  // 同时出现全局钩子和单个钩子，先执行全局的钩子
                  Ajanuw.hook[hookName](e), this[_hookName](e);
                } else if (this[_hookName] && isReturnPromsie === false) {
                  this[_hookName](e);
                } else if (Ajanuw.hook && Ajanuw.hook[hookName]) {
                  Ajanuw.hook[hookName](e);
                }
              })
            } else {
              if ((this[_hookName] && isReturnPromsie === false) && Ajanuw.hook && Ajanuw.hook[hookName]) {
                // 同时出现全局钩子和单个钩子，先执行全局的钩子
                Ajanuw.hook[hookName](e), this[_hookName](e);
              } else if (this[_hookName] && isReturnPromsie === false) {
                this[_hookName](e);
              } else if (Ajanuw.hook && Ajanuw.hook[hookName] && isReturnPromsie === true) {
                Ajanuw.hook[hookName](e);
              } else if (isReturnPromsie === true && hookName === 'error') {
                rejData(e)
              }
            }
          }
        }
      });
    },

    ok: function (nextHandle) {
      // 设置请求成功的回调函数
      return nextHandle;
      // return this;
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

    exit: function (msg) {
      // 主动退出请求
      this.msg = msg;
      this.xhr.abort(msg);
      return this;
    }

  }

  Ajanuw.prototype.init.prototype = Ajanuw.prototype;

  return function () {
    return new Ajanuw.prototype.init()
  }()
});
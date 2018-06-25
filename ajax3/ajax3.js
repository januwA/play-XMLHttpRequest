{
  ////////////
  Function.prototype.method = function (name, fn) {
    this.prototype[name] = fn;
  }
  let l = console.log

  function Config(config = {}) {
    let {
      uri,
      timeout
    } = config;
    this.uri = uri || 'http://localhos:3000';
    this.timeout = timeout || 0;
  }

  function Get(url, opt) {
    let res, rej;
    let p = new Promise((resolve, reject) => {
      res = resolve;
      rej = reject;
    });

    let xhr = new XMLHttpRequest();
    this.xhr = xhr;
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        if (xhr.status >= 200 && xhr.status < 300) {
          res(xhr);
          this._ok(xhr);
        } else {
          rej(xhr)
        }
      }
    }
    xhr.open('GET', url, true)
    xhr.timeout = 0;
    xhr.setRequestHeader('content-type', 'application/x-www-form-urlencoded')
    xhr.send();
    l(this)
    return this;
  }

  Get.method('ok', function (fn) {
    this._ok = fn;
    return this;
  })


  function Ajanuw() {}
  let config = new Config(); // 全局配置

  Ajanuw.method('create', function (opt = {}) {
    config = new Config(opt);
    return new Ajanuw()
  });

  Ajanuw.method('get', function (url, opt) {
    return new Get(url, opt)
  })

  // Ajanuw.method('get', function (url, opt = {}) {
  //   let res, rej;
  //   let p = new Promise((resolve, reject) => {
  //     res = resolve;
  //     rej = reject;
  //   });

  //   let xhr = new XMLHttpRequest();
  //   xhr.addEventListener('readystatechange', function (e) {
  //     if (xhr.readyState === 4) {
  //       if (xhr.status >= 200 && xhr.status < 300) {
  //         res(xhr)
  //       }else{
  //         rej(xhr)
  //       }
  //     }
  //   })
  //   xhr.open('GET', url, true)
  //   xhr.timeout = 0;
  //   xhr.setRequestHeader('content-type', 'application/x-www-form-urlencoded')
  //   xhr.send()
  //   return p;
  // });


  Ajanuw.method('post', function () {
    l('post请求')
    return this;
  });


  window.ajanuw = new Ajanuw()
  /////////
}
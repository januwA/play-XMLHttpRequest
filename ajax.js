/**
 * Docs: https://developer.mozilla.org/zh-CN/docs/Web/API/XMLHttpRequest
 * abort() 请求已经被发送,则立刻中止请求
 * getAllResponseHeaders()  返回所有响应头信息
 * getResponseHeader(DOMString header)  返回指定的响应头的值,
 * 
 * xhr.setRequestHeader(k， v) 设置请求头, 必须在open()之后
 */

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
    let loadEvent = 'onreadystatechange';
    let Ajanuw = function () {
        this.get = this.g;
        this.post = this.p;
    }

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

    Ajanuw.handleUrl = function (url) {
        const baseURL = Ajanuw.opt.baseurl;
        return baseURL ?
            baseURL + '/' + url.replace(/^\/+/, '') :
            url;
    }

    Ajanuw.handleBody = function (body) {
        return body ?
            Ajanuw.jsonToSerializ(body) :
            body;
    }

    Ajanuw.handleTfres = function (tfres) {
        const transformresponse = tfres ? tfres : Ajanuw.opt.tfres;
        return function (resData) {
            return transformresponse ? transformresponse(resData) : resData;
        }
    }

    Ajanuw.handleHeaders = function (headers = {}) {
        // 合并全局配置的headers和发送时的headers
        let configHeaders = Ajanuw.opt.headers || {};
        return { ...configHeaders,
            ...headers
        }
    }

    Ajanuw.prototype = {
        /**
         * 初始化全局的配置
         * @param {*} options : {
              baseurl: 'http://localhost:3000/',
              timeout: number,
              tfreq(data, headers) { },
              tfres(data) { },
              headers: { }
            }
         */
        create(options) {
            Ajanuw.opt = options || {};

            let baseurl = Ajanuw.opt.baseurl;
            if (baseurl) Ajanuw.opt.baseurl = baseurl.replace(/\/+$/, '');
        },


        /**
         * get 请求
         * @param {*} r: string
         * @param {*} options: { body, headers, tfres(data) { } }
         */
        g: function () {
            return function (r, options) {
                return new Promise((resolve, reject) => {

                    xhr[loadEvent] = handleLoad;
                    const query = Ajanuw.handleBody(options.body);

                    // get需要处理：没有查询参数的情况，有查询参数，和url中带查询参数的情况
                    let url;
                    if (query) {
                        if (r.split(/\?/)[1]) {
                            url = Ajanuw.handleUrl(r) + '&' + query
                        } else {
                            url = Ajanuw.handleUrl(r) + '?' + query
                        }
                    } else {
                        url = Ajanuw.handleUrl(r)
                    }

                    xhr.open('GET', url, true); // true 代表异步
                    xhr.setRequestHeader('Accept', 'application/json, text/plain, */*');
                    const headers = Ajanuw.handleHeaders(options.headers);
                    for (const k in headers) {
                        xhr.setRequestHeader(k, headers[k]);
                    }
                    xhr.send();

                    function handleLoad() {
                        if (xhr.readyState === XMLHttpRequest.DONE) {
                            const status = xhr.status;
                            const isOk = status >= 200 && status < 300;

                            if (isOk) {
                                // 优先级高于全局配置
                                resolve({
                                    data: Ajanuw.handleTfres(options.tfres)(xhr.response),
                                    status: xhr.status,
                                    url: xhr.responseURL,
                                    timeout: xhr.timeout,
                                })
                            } else {
                                reject(xhr)
                            }
                            // 收到回复
                        } else {
                            // 还没准备好
                        }
                    }
                });
            }
        }(),

        /**
         * post请求
         * @param {*} r 
         * @param {*} options 
         */
        p(r, options) {
            return new Promise((resolve, reject) => {
                try {
                    xhr[loadEvent] = handleLoad;
                } catch (error) {
                    rej(error)
                }

                const body = Ajanuw.handleBody(options.body);
                const url = Ajanuw.handleUrl(r);

                xhr.open('POST', `${url}`, true); // true 代表异步
                // xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

                const headers = Ajanuw.handleHeaders(options.headers);
                for (const k in headers) {
                    xhr.setRequestHeader(k, headers[k]);
                }
                xhr.send(body);

                function handleLoad() {
                    if (xhr.readyState === XMLHttpRequest.DONE) {
                        const status = xhr.status;
                        const isOk = status >= 200 && status < 300;

                        if (isOk) {
                            resolve({
                                data: Ajanuw.handleTfres(options.tfres)(xhr.response),
                                status: xhr.status,
                                url: xhr.responseURL,
                                timeout: xhr.timeout,
                            })
                        } else {
                            reject(xhr)
                        }
                        // 收到回复
                    } else {
                        // 还没准备好
                    }
                }
            });
        },
    } // prototype end..
    return new Ajanuw();
});
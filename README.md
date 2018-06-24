
[源码地址](https://github.com/januwA/play-XMLHttpRequest/blob/ajax2/ajax2/ajax2.js)


## 全局配置
```
let http = ajanuw.create({
  uri: 'localhost:3000/api' // baseURL
  timeout: '' // 全局请求超时时间
})
```

## get
> 默认返回 promsie数据
> promsie不能主动退出请求
```
// localhost:3000/api/login?name=xxx&pass=123
http.get('/login', {
  query: { // query
    name: 'xxx',
    pass: 123,
  },
  set: {}, // 头信息
  timeout: 2000,
  resType: 'text', // 服务器返回的数据，默认为json
}).then(res => {
  // res.data
});


// 不返回 promise
// 可以使用关于当前请求的一些钩子
http.get('/login', {
  query: { // query
    name: 'xxx',
    pass: 123,
  },
  set: {}, // 头信息 headers
  timeout: 2000,
}, 0)
.ok(res => {// res.data})
.timeout(res => {// res})
.error(err => {// err})
.progress(p => {// p})
.abort( res => {// res})
.loadstart(res => {// res})
.loadend(res => {// res})
```

## post
> 支持3中post数据
```
// object
http.post('/create',{
  query: {
    id: '000'
  },
  body: { // body
    name: 'xxx',
    age: [12, 14]
  },
  set: {}, // headers
}).then(res => {
  // res.data
})

// formData
http.post('/create',{
  body: new formData(),
  set: {}, // headers
}).then(res => {
  // res.data
})


// form表单，暂不支持media表单
http.post('/create',{
  body: '.form',
  set: {}, // headers
}).then(res => {
  // res.data
})
```
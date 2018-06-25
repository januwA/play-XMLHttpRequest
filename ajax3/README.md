
## ajanuw.create
> 设置全局配置属性，包括以后使用ajanuw.get
> 返回一个http含有get，post
```
ajanuw.create({
    uri: '',
    timeout: ''
}).get(orl, opt)
```

## ajanuw.abort
> 一个退出请求的钩子
```
ajanuw.get('/', {
    name: 'a'
})
ajanuw.abort('a');
// 或者:
ajanuw.abort('a', xhr => xhr.abort())
```


## ajanuw.get
```
ajanuw.get(url,{
    name: '', // 请求的名字,用来abort
    query: {},
    set: {},
    timeout: '',
    async: true
})
```
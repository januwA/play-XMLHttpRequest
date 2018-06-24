function jsonToSerialize(o) {
    /**
     把json转化成序列化字符串
     console.log(jsonToSerialize({name:'ajanuw',age:23}));
     name=ajanuw&age=23
    */
    // bug
    //   let s = '';
    //   for (let el in obj) {
    //     s += `${el}=${obj[el]}&`
    //   }
    //   return s.replace(/&$/, '');

    // 18/6/23更新
    // { name: 'ajanuw', age: [12, 14] } -> jsonToSerialize -> name=ajanuw&age=12&age=14
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


console.log(
    jsonToSerialize({
        name: "赵",
        age: [12, 14]
    })
);

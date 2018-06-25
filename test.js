let l = console.log

Function.prototype.method = function (name, fn) {
    this.prototype[name] = fn;
}

Promise.method('ok', function (fn) {
    fn()
})

let x = new Promise((resolve, reject) => {
    resolve('res')
})
// .ok(function () {
//     // l('ok hook')
// })

l(x)
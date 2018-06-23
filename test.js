let a = [1, 2, 3, ['a', 'b'], 4]


function scan(eles) {
    if (eles.length === 0) {
        return eles;
    } else {
        eles.forEach(el => {
            if (el.length === 0) {
                return el
            } else {
                return scan(el)
            }
        });
    }
}

let i = scan(a)

l(i)
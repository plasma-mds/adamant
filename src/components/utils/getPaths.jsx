const getPaths = (object, value) => {
    return Object
        .keys(object)
        .reduce((r, k) => {
            var kk = Array.isArray(object) ? `[${k}]` : `${k}`;
            if (object[k] === value) {
                r.push(kk);
            }
            if (object[k] && typeof object[k] === 'object') {
                r.push(...getPaths(object[k], value).map(p => kk + (p[0] === '[' ? '' : '.') + p));
            }
            return r;
        }, []);
}

export default getPaths;
function format(intensionStorage) {
    const res = [];
    console.log(intensionStorage.intensions);
    for (let [, originMap] of intensionStorage.intensions) {
        for (let [, intensions] of originMap) {
            for (let intension of intensions) {
                res.push(intension.toObject());
            }
        }
    }
    return res;
}

function query(intensionStorage, query) {
    return format(intensionStorage, query)
}

module.exports = {
    query
};



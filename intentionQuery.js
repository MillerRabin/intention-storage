function format(intentionStorage) {
    const res = [];
    for (let [, originMap] of intentionStorage.intentions) {
        for (let [, intentions] of originMap) {
            for (let intention of intentions) {
                res.push(intention.toObject());
            }
        }
    }
    return res;
}

function query(intentionStorage, query) {
    return format(intentionStorage, query)
}

module.exports = {
    query
};



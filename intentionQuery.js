function formatIntentions(intentionStorage) {
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

function formatLinkedStorages(intentionStorage) {
    const res = [];
    for (let [, link] of intentionStorage.links) {
        res.push(link.toObject());
    }
    return res;
}

function queryIntentions(intentionStorage, query) {
    return formatIntentions(intentionStorage, query)
}

function queryLinkedStorages(intentionStorage, query) {
    return formatLinkedStorages(intentionStorage, query)
}

module.exports = {
    queryIntentions, queryLinkedStorages
};



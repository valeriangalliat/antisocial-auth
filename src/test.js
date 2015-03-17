const assert = require('assert')
const auth = require('./')

auth.generateNonce()
  .then(nonce => {
    assert.equal(nonce.length, auth.nonceSize)

    const displayNonce = auth.beautify(nonce)

    assert(nonce.equals(auth.uglify(displayNonce)))

    assert(auth.checkTime((Date.now() - auth.expirationTime) + 1000))
    assert(!auth.checkTime((Date.now() - auth.expirationTime) - 1000))
  })
  .then(null, require('promise-done'))

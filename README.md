# antisocial-auth [![npm version](http://img.shields.io/npm/v/antisocial-auth.svg?style=flat-square)](https://www.npmjs.org/package/antisocial-auth)

> Social authentication for websites that don't provide any.

Overview
--------

This project will both describe:

1. a protocol to authenticate users from any website on your software,
   regardless they provide social authentication feature,
1. a Node.js library to ease the implementation.

Protocol
--------

An user wants to authenticate on your website with his example.com
username.

1. They fill a form with the username they want to authenticate with.

1. You generates a [nonce], and store it in some kind of session (like
   signed cookies) for this user, together with the username they want
   to authenticate.

1. The user is then told to paste this "verification code" (the nonce)
   somewhere on example.com where they can easily be identified, that
   may be in a private message to a "bot" user you own, in teir profile
   description, or whatever is possible on the website.

1. When the use is done, they confirm it to your website (optionally
   providing some data so you can easily find the key if it's not
   ovbious), which will search the expected location for the nonce.

1. If the nonce is found, and it was effectively posted by the user in
   question, the user is a authenticated, and you can be sure they own
   the example.com account they claimed.

Also, note you could add some time limit to complete the authentication,
for exmaple by storing the current time in session when the
authentication request is made (when the nonce is generated), and
checking it before verifying the nonce.

[nonce]: http://en.wikipedia.org/wiki/Cryptographic_nonce

Library
-------

Example with an Express web app.

```js
// Default settings.
const auth = require('antisocial-auth')

// Extend settings.
const auth = require('antisocial-auth').extend({
  nonceSize: 256, // Change nonce size (default is 128).
  expirationTime: 1000 * 60 * 10, // Expire after 10 minutes (default is 2).
})

// example.com imaginary API/crawler.
const example = require('example')

const app = require('express')()
const then = require('express-then')

app.use(require('cookie-parser')('secret'))
app.set('views', __dirname + '/views')
app.set('view engine', 'whatever')

// Request user authentication.
app.get('/auth/:user', then(async (req, res) => {
  const user = req.param.user
  const nonce = await auth.generateNonce() // Generate nonce buffer.
  const nonce64 = nonce.toString('base64') // Can't set a buffer as JSON cookie.
  const beginTime = Date.now() // Store the time for later verification.

  res.cookie('auth', { user, nonce64, beginTime }, { httpOnly: true, signed: true })
  res.render('auth', { user, nonce: auth.beautify(nonce) })

  // `auth.beautify` will return something like this:
  //
  //     -----BEGIN AUTH-----
  //     1RZqcR7W+Z5itOuGVyEmIquYWpdMW92u
  //     rq4zbiUb4VhZIymJg4pQC4uLRHqcCqKk
  //     /06zQIt7Hf/j5ssElL+ZChkVlV6qoZxt
  //     M9dhXjoeYDkpG9BWXOnb7EsNWQiWsoYY
  //     GM9ApEoVFX34DZ8eSVa9TWLOZ0yKK/xf
  //     aEHXsz8qJHk=
  //     -----END AUTH-----
  //
  // The user is supposed to paste it somewhere on his example.com
  // account, like in a private message to a bot you own, or his profile
  // description.
}))

// Verify authentication.
app.get('/auth/:user/confirm', then(async (req, res) => {
  const { user, nonce64, beginTime } = req.signedCookies.auth
  const nonce = new Buffer(nonce64, 'base64')

  // Bad request.
  if (user !== req.params.user) {
    return res.status(400).end()
  }

  // Authentication timeout expired.
  if (!auth.checkTime(beginTime)) {
    return res.status(401).end()
  }

  // Get (for example) user profile description.
  const { desc } = await example.getProfile(user)

  // Search for authentication tags and parse wrapped content.
  const buffer = auth.uglify(desc)

  // Failed authentication.
  if (!nonce.equals(buffer)) {
    return res.status(401).end()
  }

  // The user is authenticated!
  res.cookie('user', user, { httpOnly: true, signed: true })
  res.clearCookie('auth')
  res.redirect('/')
}))

// Regular page.
app.get('/', (req, res) => {
  if (req.signedCookies.user) {
    // The user is authenticated.
  }

  // ...
})
```

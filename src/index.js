const bindLate = require('bind-late')
const denodeify = require('es6-denodeify')(Promise)
const rand = denodeify(require('crypto').randomBytes)
const string = require('string')

export default bindLate({
  core: {
    // Encode and decode buffers.
    encode: encoding => x => x.toString(encoding),
    decode: encoding => x => new Buffer(x, encoding),

    // Hard wrap text to given width.
    wrap: width => text =>
      text.replace(RegExp(`(.{1,${width}})`, 'g'), '$1\n'),

    // Wrap text with begin and end tags.
    decorate: (beginTag, endTag) =>
      text => `${beginTag}\n${text}${endTag}\n`,

    // Find text between begin and end tags.
    find: (beginTag, endTag) =>
      text => string(text)
        .between(beginTag, endTag)
        .toString(),

    // Generate a nonce of configured size.
    generateNonce: size => () => rand(size),

    // From buffer to wrapped encoded string with tags (for display).
    beautify: ({ decorate, wrap, encode }) =>
      buffer => decorate(wrap(encode(buffer))),

    // From tagged wrapped encoded string to buffer.
    uglify: ({ decode, find }) =>
      text => decode(find(text).replace(/\s/g, '')),

    // Check given time against expiration delay.
    checkTime: expirationTime =>
      time => (Date.now() - time) < expirationTime,
  },

  display: {
    beginTag: '-----BEGIN AUTH-----',
    endTag: '-----END AUTH-----',
    wrapWidth: 32,
    encoding: 'base64',

    encode: _ => _.core.encode(_.display.encoding),
    decode: _ => _.core.decode(_.display.encoding),
    wrap: _ => _.core.wrap(_.display.wrapWidth),
    decorate: _ => _.core.decorate(_.display.beginTag, _.display.endTag),
    find: _ => _.core.find(_.display.beginTag, _.display.endTag),
  },

  // Sice of the random identification nonce.
  nonceSize: 128,

  // Discard messages after 2 minutes.
  expirationTime: 1000 * 60 * 2,

  generateNonce: _ => _.core.generateNonce(_.nonceSize),

  beautify: _ => _.core.beautify({
    decorate: _.display.decorate,
    wrap: _.display.wrap,
    encode: _.display.encode,
  }),

  uglify: _ => _.core.uglify({
    decode: _.display.decode,
    find: _.display.find,
  }),

  checkTime: _ => _.core.checkTime(_.expirationTime),
})

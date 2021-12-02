// This file replaces node_modules/mimer/lib/data/parser.js, as it tries to
// read a file at the path that is computed dynamically and this does not work
// when bundled. I've made simple version as we don't need a lot of mime types
// for email templating.

module.exports = function () {
  return {
    atom: 'application/atom+xml',
    epub: 'application/epub+zip',
    js: 'application/javascript',
    json: 'application/json',
    mathml: 'application/mathml+xml',
    bin: 'application/octet-stream',
    pdf: 'application/pdf',
    rss: 'application/rss+xml',
    '7z': 'application/x-7z-compressed',
    dmg: 'application/x-apple-diskimage',
    torrent: 'application/x-bittorrent',
    ttf: 'application/x-font-ttf',
    woff: 'application/font-woff',
    lnk: 'application/x-ms-shortcut',
    rar: 'application/x-rar-compressed',
    xhtml: 'application/xhtml+xml',
    mp3: 'audio/mpeg',
    ogg: 'audio/ogg',
    gif: 'image/gif',
    jpeg: 'image/jpeg',
    jpg: 'image/jpeg',
    png: 'image/png',
    svg: 'image/svg+xml',
    svgz: 'image/svg+xml',
    webp: 'image/webp',
    ico: 'image/x-icon',
    eml: 'message/rfc822',
    mime: 'message/rfc822',
    ics: 'text/calendar',
    css: 'text/css',
    csv: 'text/csv',
    html: 'text/html',
    htm: 'text/html',
    txt: 'text/plain',
    rtx: 'text/richtext',
    vcard: 'text/vcard',
    h264: 'video/h264',
    mp4: 'video/mp4',
    mpeg: 'video/mpeg',
    ogv: 'video/ogg',
    webm: 'video/webm'
  }
}

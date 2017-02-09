
const
  isYoutube = require('../../../cms/shared/youtube'),
  isVimeo = require('../../../cms/shared/vimeo');

module.exports = (dust, config) => {
  dust.filters.media = function (value) {
      var returnString = '';
      if (value.mime === 'video/youtube') {
          returnString += '<iframe type="text/html" src="https://www.youtube.com/embed/' + isYoutube(value.source) + '" frameborder="0"></iframe>';
        } else if (value.mime === 'video/vimeo') {
          returnString += '<iframe src="https://player.vimeo.com/video/' + isVimeo(value.source) + '" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>';
        } else if (value.type === 'video') {
          returnString += '<video';
          if (value.attrributes) {
            Object.keys(value.attrributes).forEach((key) => {
              returnString += ' ' + key + '="' + value.attrributes[key].replace(/"/g, '&quot;') + '"';
            });
          }
          returnString += ' controls>';

          let alternatives = [];
          if (value.source) {
            alternatives.push({
              src: value.source
            });
          }
          if (value.alternatives && Array.isArray(value.alternatives)) {
            alternatives = alternatives.concat(value.alternatives);
          }

          alternatives.forEach((_source) => {
            if (!_source.src) return;
            returnString += '<source src="' + _source.src + '"';
            if (_source.media) {
              returnString += ' media="' + _source.media + '"';
            }
            if (_source.type) {
              returnString += ' type="' + _source.type + '"';
            }
            returnString += '>';
          });

          returnString += '</video>';
        } else if (value.type === 'image') {

          returnString += '<img src="' + value.source + '"';
          if (value.attributes) {
            Object.keys(value.attributes).forEach((key) => {
              returnString += ' ' + key + '="' + value.attributes[key].replace(/"/g, '&quot;') + '"';
            });
          }
          returnString += '/>';
        } else if (isYoutube(value.source)) {
          returnString += '<iframe type="text/html" src="https://www.youtube.com/embed/' + isYoutube(value.source) + '" frameborder="0"></iframe>';
        } else if (isVimeo(value.source)) {
          returnString += '<iframe src="https://player.vimeo.com/video/' + isVimeo(value.source) + '" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>';
        } else {
          returnString += '<a target="_blank" href="' + value.source + '"><img src="img/cms/cms/svg/file.svg"/></a>';
        }
      return returnString;
    };
};

var Promise = require('bluebird');
module.exports = function (app) {

  var artists = {}, labels = {},
    Artist = app.models.Artist,
    Album = app.models.Album,
    Label = app.models.Label;

  return Promise
    .all(
      Promise.map(
        [
          'Pink Floyd',
          'Iron Maiden',
          'Bjork'
        ],
        function (artistName) {
          "use strict";
          return Artist
            .create({name: artistName})
            .then(
              function (artistInstance) {
                artists[artistName] = artistInstance;
              }
            )
        }
      ),
      Promise.map(
        [
          'EMI',
          'Parlophone',
          'One Little Indian'
        ],
        function (labelName) {
          "use strict";
          return Label
            .create({name: labelName})
            .then(
              function (labelInstance) {
                labels[labelName] = labelInstance;
              }
            )
        }
      )
    )
    .then(
      function () {
        "use strict";
        return Promise.map(
          [
            {
              albumTitle: 'The Endless River',
              label: labels['Parlophone'],
              artist: artists['Pink Floyd']
            },
            {
              albumTitle: 'The Dark Side of the Moon',
              label: labels['EMI'],
              artist: artists['Pink Floyd']
            },
            {
              albumTitle: 'The Book of Souls',
              label: labels['Parlophone'],
              artist: artists['Iron Maiden']
            },
            {
              albumTitle: 'Fear of the Dark',
              label: labels['EMI'],
              artist: artists['Iron Maiden']
            },
            {
              albumTitle: 'Selmasons: Dancer In The Dark',
              label: labels['One Little Indian'],
              artist: artists['Bjork']
            }
          ],
          function (albumData) {
            "use strict";
            Album
              .create({title: albumData.albumTitle})
              .then(
                function (album) {
                  album.label(albumData.label);
                  album.artist(albumData.artist);
                  return album.save()
                }
              )
          }
        )
      }
    )
    .catch(
      function (error) {
        "use strict";
        console.log('Error: ' + JSON.stringify(error, null, 2));
      }
    )
};

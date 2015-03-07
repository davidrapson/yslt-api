var fs = require('fs');
var http = require('http');
var express = require('express');

var app = express();

app.set('port', (process.env.PORT || 8000));

function random(arr) {
    return arr[Math.floor(Math.random()*arr.length)]
}

function matchAlbumArtist(albums, artistName) {
    return (albums.filter(function(item) {
        return item.artistName.indexOf(artistName) !== -1
    }))[0];
}

function getItunesData(album, cb) {
    http.request({
        host: 'itunes.apple.com',
        path: '/search/?entity=album&term=' + encodeURIComponent(album.title)
    }, function(response) {
        var str = '';
        response.on('data', function (chunk) { str += chunk; });
        response.on('end', function () {
            var data = JSON.parse(str);
            var itunesData = matchAlbumArtist(data.results, album.artist);
            var composite = {
                artist: album.artist,
                title: album.title,
                releaseDate: album.releaseDate,
                score: parseInt(album.score, 10),
                artwork: itunesData && itunesData.artworkUrl100 || false,
                itunesUrl: itunesData && itunesData.collectionViewUrl || false
            }
            cb && cb.call(this, composite);
        });
    }).end();
}

app.get('/album.json', function (req, res) {
    fs.readFile('data/albums.json', 'utf8', function (err,data) {
        if (err) { return console.log(err); }
        var album = random((JSON.parse(data)).results);
        getItunesData(album, function(composite) {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(composite));
        });
    });
})

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'));
});

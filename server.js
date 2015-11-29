'use strict';

import fs from 'fs';
import http from 'http';
import express from 'express';

const app = express();

app.set('port', (process.env.PORT || 8000));

const random = arr => arr[Math.floor(Math.random() * arr.length)];

const matchArtist = (albums, artist) => albums.find(x => x.artistName.includes(artist));

const makeComposite = (album, itunesData) => ({
    artist: album.artist,
    title: album.title,
    releaseDate: album.releaseDate,
    score: parseInt(album.score, 10),
    artwork: itunesData && itunesData.artworkUrl100 || null,
    itunesUrl: itunesData && itunesData.collectionViewUrl || null
});

function getItunesData(album, cb) {
    http.request({
        host: 'itunes.apple.com',
        path: `/search/?entity=album&term=${encodeURIComponent(album.title)}`
    }, response => {
        let str = '';
        response.on('data', function (chunk) { str += chunk; });
        response.on('end', function () {
            let data = JSON.parse(str);
            let itunesData = matchArtist(data.results, album.artist);
            let composite =  makeComposite(album, itunesData)
            cb && cb.call(this, composite);
        });
    }).end();
}

app.get('/album.json', (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Content-Type', 'application/json; charset=utf-8');
    fs.readFile('data/albums.json', 'utf8', (err,data) => {
        if (err) { return console.log(err); }
        let album = random((JSON.parse(data)).results);
        getItunesData(album, composite => {
            res.end(JSON.stringify(composite));
        });
    });
})

app.listen(app.get('port'), () => {
    console.log(`Node app is running at localhost: ${app.get('port')}`)
});

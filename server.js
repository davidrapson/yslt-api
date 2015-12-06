'use strict';

import fs from 'fs';
import fetch from 'node-fetch';
import express from 'express';

const app = express();

app.set('port', (process.env.PORT || 8000));

const random = arr => arr[Math.floor(Math.random() * arr.length)];

function compositeData(album, spotifyData) {
    return {
        artist: album.artist,
        title: album.title,
        releaseDate: album.releaseDate,
        score: parseInt(album.score, 10),
        artwork: spotifyData && spotifyData.images[0].url || null,
        itunesUrl: null,
        spotify: spotifyData
    };
}

function getSpotifyData(album) {
    let endpoint = 'https://api.spotify.com/v1/search';
    let title = encodeURIComponent(album.title);
    let artist = encodeURIComponent(album.artist);
    return fetch(`${endpoint}?q=artist:${artist}%20album:${title}&type=album`)
        .then(resp => resp.json())
        .then(data => data.albums.items)
        .then(items => items.find(item => (
            item.album_type === 'album' &&
            item.available_markets.indexOf('GB') >= 0
        )));
}

app.get('/album.json', (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Content-Type', 'application/json; charset=utf-8');
    fs.readFile('data/albums.json', 'utf8', (err,data) => {
        if (err) { return console.log(err); }
        let album = random((JSON.parse(data)).results);
        getSpotifyData(album)
            .then(data => compositeData(album, data))
            .then(result => {
                res.end(JSON.stringify(result));
            });
    });
})

app.listen(app.get('port'), () => {
    console.log(`Node app is running at localhost: ${app.get('port')}`)
});

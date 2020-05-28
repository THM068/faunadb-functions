let functions, admin, faunadb, q, client, express, cors, api

if (typeof api === 'undefined') {
    functions = require('firebase-functions');
    admin = require('firebase-admin');
    express = require('express');
    cors = require('cors');
    admin.initializeApp(functions.config().firebase);

    faunadb = require('faunadb');
    q = faunadb.query;
    client = new faunadb.Client({
        secret: 'fnADs3TFy_ACAi5aWGqywul2DfvknNsMuARnR0Wi'
    });


    api = express();

// Automatically allow cross-origin requests
    api.use(cors({ origin: true }));

    api.get(['/api/v1', '/api/v1/'], (req, res) => {
        res.status(200)
            .send(`<img src="https://media.giphy.com/media/hhkflHMiOKqI/source.gif">`)
    });

    api.post(['/api/v1/games', '/api/v1/games/'], (request, response) => {
        let addGame = client.query(
            q.Create(q.Collection("games"),{
                data: {
                    title: request.body.title,
                    consoles: request.body.consoles,
                    metacritic_score: request.body.metacritic_score,
                    release_date: q.Date(request.body.release_date)
                }
            })
        );

        addGame.then(result => {
            response.status(200).send(`Saved! ${result.ref}`);
            return;
        }).catch(reason => {
            response.error(reason);
        });
    });

    api.get(['/api/v1/console/:name', '/api/v1/console/:name/'], (req, res) => {
        console.log(req.params.name.toLowerCase());
        let findGamesForConsole = client.query(
            q.Map(
                q.Paginate(q.Match(q.Index('games_by_console'), req.params.name.toLowerCase())),
                q.Lambda(['title', 'ref'], q.Var('title'))
            )
        );
        findGamesForConsole
            .then(result => {
                console.log(result);
                res.status(200).send(result);
                return
            })
            .catch(error => {
                res.error(error)
            })
    });

    api.get(['/api/v1/games/', '/api/v1/games'], (req, res) => {
        let findGamesByName = client.query(
            q.Map(
                q.Paginate(
                    q.Filter(
                        q.Match(q.Index('games_by_title')),
                        q.Lambda(
                            ['title', 'ref'],
                            q.GT(
                                q.FindStr(
                                    q.LowerCase(q.Var('title')),
                                    req.query.title.toLowerCase()
                                ),
                                -1
                            )
                        )
                    )
                ),
                q.Lambda(['title', 'ref'], q.Get(q.Var('ref')))
            )
        );
        findGamesByName
            .then(result => {
                console.log(result);
                res.status(200).send(result);
                return
            })
            .catch(error => {
                res.error(error)
            })
    });
}

exports.api = functions.https.onRequest(api);



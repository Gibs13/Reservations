'use strict';

process.env.DEBUG = 'actions-on-google:*';
let ApiAiApp = require('actions-on-google').ApiAiApp;
let express = require('express');
let bodyParser = require('body-parser');
let horraires = require('./horraires.js');

let app = express();
app.use(bodyParser.json({type: 'application/json'}));

let sprintf = require('sprintf-js').sprintf;





// Function Handler


app.post('/', function (req, res) {
    const assistant = new ApiAiApp({request: req, response: res});

    function goodDate(assistant) {

        let date = assistant.getArgument('date').date;
        console.log(date);
        let today = new Date();
        
        today = [today.getDate(),today.getMonth()];
        date = [date.substring(8,10),date.substring(5,7)-1];
        console.log(today + '  ' + date)
        if (date[1]<today[1] || date[0]<today[0]-7) {
            console.log('plus un mois');
        } else if (date[0]<today[0]) {
            console.log('plus une semaine');
        }
    }

    function reserve (assistant) {

        goodDate(assistant);
        assistant.data.city = assistant.getArgument('city')





        assistant.ask(assistant.data.city);
    }

    function quit (assistant) {
        assistant.tell('Goodbye!');
    }


    // Mapping intentions

    let actionMap = new Map();

    actionMap.set('reserve', reserve);
    actionMap.set('quit', quit);

    assistant.handleRequest(actionMap);
});

// Server 

if (module === require.main) {
  // [START server]
  // Start the server
  let server = app.listen(process.env.PORT || 8080, function () {
    let port = server.address().port;
    console.log('app listening on port %s', port);
  });
  // [END server]
}
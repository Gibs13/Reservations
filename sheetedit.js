let express = require('express');

var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');
var sheets = google.sheets('v4');
var SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];



  var auth = new googleAuth();
  var oauth2Client = new auth.OAuth2("801820678701-mg5qa1itum2uhave87mqpja89mo6j393.apps.googleusercontent.com", "HSXReMn_3Vs_FwpTA4QYVwAX", "urn:ietf:wg:oauth:2.0:oob");
  
function sheetedit(resto, date, creneau, places, valeur, nom){
  /*var authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });

  console.log('Visit the url: ', authUrl);*/
  
  oauth2Client.credentials = { access_token: 'ya29.Glt8BFZClGW4149SklLfluR6j2KAWo6y70HN_rLyYcn4t0fnbOllQIKsX12V7HeLnRAM-8rPIbfsYg-S2LGdZXzgub7dvmTCRgCmWMna5xWSqj6pvgM6dwcAdkSP',
  refresh_token: '1/34_2tUppw8e7pKXNoLVD6-4WXRppNR5O9hWc4GXs14A',
  token_type: 'Bearer',
  expiry_date: 1499077990040 };
  if (!nom) {
    
    console.log('pas horaires :');
    return get(resto);
  } else {
    return callback(resto, date, creneau, places, valeur, nom);
  }

/*    oauth2Client.getToken('4/2JSXXHjr1P8FxrImwNgH7Gi4T9R-CqCbL2buhIW1bxs', function (err, tokens) {
      if (err) {
        console.log('The Auth returned an error: ' + err);
        return;
      }
      // set tokens to the client
      // TODO: tokens should be set by OAuth2 client.
      oauth2Client.credentials = tokens;
      console.log(oauth2Client.credentials);
      callback();
    });*/

}

function get(resto) {
    sheets.spreadsheets.values.get({
        auth: oauth2Client,
        spreadsheetId: '1DnlKFhV0vNPJ-vQrixpocbcXRlHL5xKJxx5h7IF_qEc',
        range: "'" + resto + "'"
    }, function(err, response) {

        if (err) {
            console.log('The API returned an error: ' + err);
            return;
        }
        let rows = response.values;
        let row;
        let horaires = {};
        for (let i=0; i < rows.length; i++) {
            row = rows[i];
            row.push(i+1);
            horaires[row.shift()] = row;
        }
        console.log('horaires pretes');
        return horaires;
    })
}

function callback(resto, date, creneau, places, valeur, nom){
  sheets.spreadsheets.values.batchUpdate({
    auth: oauth2Client,
    spreadsheetId: '1DnlKFhV0vNPJ-vQrixpocbcXRlHL5xKJxx5h7IF_qEc',
    resource: {
      valueInputOption: "RAW",
      data: [{range: resto + '!' + creneau + date,
      values: [
      [valeur]]
  }]}
}, function(err, response) {
  console.log(response);
    if (err) {
      console.log('The API returned an error: ' + err);
      return;
    }
  });
}

  module.exports = sheetedit;


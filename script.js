$(document).ready(function(){
    retrieveIdentity("Thing");
    retrieveDebut("Benjamin Grimm (Earth-616)");
});

/**
 * Adapted from work by ujjawal found at https://github.com/ujjawal/Parse-Wiki-Infobox
 */



/**
 * parse together data options to create query string for calls to wikia API
 * @param {object} data - an object holding properties 
 */
function parseDataOptions(data){
    var queryString = "";
    for(var i = 0; i < Object.keys(data).length; i++){
        queryString += Object.keys(data)[i] + "=" + data[Object.keys(data)[i]] + "&";
    }
    // remove final ampersand from end of query string
    queryString = queryString.substring(0, queryString.length - 1);
    return queryString;
}





 /**
  * retrieveIdentity
  * searches Marvel wiki for mantle and will retrieve information on the character from which their real identity will be extracted
  * @param {string} mantle - mantle (public name) of character to be looked up (for instance Iron Man or Spider-Man)
  */
function retrieveIdentity(mantle){
    var queryOptions = {
        format: 'json',
        action: 'query',
        prop: 'revisions',
        rvprop: 'content',
        rvsection: '0',
        callback: '?',
        titles: encodeURIComponent(mantle)
    };

    var queryString = parseDataOptions(queryOptions);

    $.ajax({
        type: "GET",
        url: 'https://marvel.wikia.com/api.php?' + queryString,
        dataType: "json",
        success: function (data, textStatus, jqXHR) {
            parseWikiAndExtractCharacter(data);
        },
        error: function (errorMessage) {
        }
    });
}


/**
 * extracts the most relavant character from the disambiguation page of the wiki
 * @param {*} result - json object from wikia API containing disambiguation on characters
 */
function parseWikiAndExtractCharacter(result){
    var key = 0;
    for(i in result.query.pages)
    key = i;
    
    content = result.query.pages[key].revisions[0]['*'];

    var identity = content.match(/Main Character\s*=\s(.*)\|/g)[0];
    var delimiter = '= [[';
    var startIndex = identity.indexOf(delimiter);
    identity = identity.substring(startIndex + delimiter.length, identity.length - 1);

    console.log(identity);
}



 /**
  * retrieveDebut
  * searches the Marvel wiki for a character name (based on their true identity) and will retrieve information on the character from which their first appearance/debut comic will be extracted.
  * @param {string} secretIdentity - real name of character looked up
  */
function retrieveDebut(secretIdentity){
    var queryOptions = {
        format: 'json',
        action: 'query',
        prop: 'revisions',
        rvprop: 'content',
        rvsection: '0',
        callback: '?',
        titles: encodeURIComponent(secretIdentity)
    };

    var queryString = parseDataOptions(queryOptions);

    $.ajax({
        type: "GET",
        url: 'https://marvel.wikia.com/api.php?' + queryString,
        dataType: "json",
        success: function (data, textStatus, jqXHR) {
            parseWikiAndExtractDebut(data);
        },
        error: function (errorMessage) {
        }
    });
}

/**
 * extracts the debut issue of the searched character from the wiki
 * @param {*} result - json object from wikia API containing character information
 */
function parseWikiAndExtractDebut(result){
    var key = 0;
    for(i in result.query.pages)
    key = i;
    
    content = result.query.pages[key].revisions[0]['*'];

    var debut = content.match(/\| First\s*=\s(.*)/g)[0];
    var delimiter = '= ';
    var startIndex = debut.indexOf(delimiter);
    debut = debut.substring(startIndex + delimiter.length);

    console.log(debut);
}
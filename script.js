$(document).ready(function(){
    retrieveIdentity("Thing");
    // retrieveIdentity("spider-man");
    retrieveIdentity("Spider-Man");
    retrieveIdentity("Venom");
    // retrieveIdentity("venom");
    retrieveIdentity("Falcon");
    // retrieveDebut("Benjamin Grimm (Earth-616)");
    
    // retrieveDebut('Edward Brock (Earth-616)');
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
            var identity = parseWikiAndExtractIdentity(data);
            retrieveDebut(identity);
        },
        error: function (errorMessage) {
        }
    });
}


/**
 * extracts the most relavant character from the disambiguation page of the wiki
 * 
 * find way to allow redirects in this method. for example try spider-man with lower case s and m
 * 
 * @param {*} result - json object from wikia API containing disambiguation on characters
 */
function parseWikiAndExtractIdentity(result){
    var key = 0;
    for(i in result.query.pages)
    key = i;
    
    content = result.query.pages[key].revisions[0]['*'];
    // console.log('content: ', content);

    var identity = content.match(/Main Character\s*=\s(.*)\|/g)[0];
    var delimiter = '= [[';
    var startIndex = identity.indexOf(delimiter);
    identity = identity.substring(startIndex + delimiter.length, identity.length - 1);

    // check to ensure identity is from main universe
    var searchStr = " (Earth-616)";
    if(identity.indexOf(searchStr) < 0){
        // if not found concatenate searchStr to identity
        identity += searchStr;
    }
    
    console.log(identity);
    return identity;
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
        titles: encodeURIComponent(secretIdentity),
        redirects: ''
    };

    var queryString = parseDataOptions(queryOptions);

    $.ajax({
        type: "GET",
        url: 'https://marvel.wikia.com/api.php?' + queryString,
        dataType: "json",
        success: function (data, textStatus, jqXHR) {
            var debut = parseWikiAndExtractDebut(data);
        },
        error: function (errorMessage) {
        }
    });
}

/**
 * extracts the debut issue of the searched character from the wiki
 * comments: comics are weird in that there can be multiple first appearances/debuts for a character
 * A character can appear with a cameo in an early comic, then appear later in full (for instance Venom)
 * Also a character can take different mantle or identity (for instance, Falcon (Sam Wilson) has
 *      has taken up the mantle of Captain America, traditionally Steve Rogers, at times)
 * @param {*} result - json object from wikia API containing character information
 */
function parseWikiAndExtractDebut(result){
    var key = 0;
    for(i in result.query.pages)
    key = i;
    
    content = result.query.pages[key].revisions[0]['*'];
    // console.log('content: ', content)

    var debutArr = [];

    var debut = content.match(/\| First.*=\s(.*)/g);
    // format first debut
    var delimiter = '= ';
    var startIndex = debut[0].indexOf(delimiter);
    debutArr.push(debut[0].substring(startIndex + delimiter.length));
    
    // check to see if there is more than one debut
    if(debut.length > 1){
        // extract further debuts
        // pattern: {{cid|"text to grab"}}("more text to grab")
        var pattern = /\{\{cid\|(.*?)\}\}(\(.*?\))/g;
        var extraDebuts = null;
    
        while( (extraDebuts = pattern.exec(debut[1])) !== null){
            debutArr.push(`${extraDebuts[1]} ${extraDebuts[2]}`);
        }
    }

    console.log("debutArr: ", debutArr);
    return debutArr;
}
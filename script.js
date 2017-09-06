function Character(name) {
    this.name = name;
    this.secretIdentity = null;
    this.debutArr = [];
}
Character.prototype.setSecretIdentity = function(secretIdentity){
    this.secretIdentity = secretIdentity;
}
Character.prototype.setDebutArr = function(debutArr){
    this.debutArr = debutArr;
}
Character.prototype.getSecretIdentity = function(){
    return this.secretIdentity;
}
Character.prototype.getDebutArr = function(){
    return this.debutArr;
}



$(document).ready(function(){
    // gatherInfo("Thing");
    // gatherInfo("Venom");
    // gatherInfo("Spider-Man");

    applyEventHandlers();
    // retrieveIdentity("Thing");
    // retrieveIdentity("spider-man");
    // retrieveIdentity("Spider-Man");
    // retrieveIdentity("Venom");
    // retrieveIdentity("venom");
    // retrieveIdentity("Falcon");
    // retrieveDebut("Benjamin Grimm (Earth-616)");
    
    // retrieveDebut('Edward Brock (Earth-616)');
});

function applyEventHandlers(){
    $('#submit').click(submitForm);
}

function submitForm(){
    console.log('submit');
    // var charName = $("input[name:'charName']").val();
    var charName = $("#charName").val();
    gatherInfo(charName);
}

/**
 * Adapted from work by ujjawal found at https://github.com/ujjawal/Parse-Wiki-Infobox
 */


/**
 * @param {string} characterName - name of character
 */
function gatherInfo(characterName){
    // var character = {
    //     name: characterName
    // }
    // var character;
    // character = new character(characterName);
    var character = new Character(characterName);
    retrieveIdentity(character);
}



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
  * @param {object} character - character object containing name of character to be looked up
  */
function retrieveIdentity(character){
    var queryOptions = {
        format: 'json',
        action: 'query',
        prop: 'revisions',
        rvprop: 'content',
        rvsection: '0',
        callback: '?',
        titles: encodeURIComponent(character.name),
        redirects: ''
    };

    var queryString = parseDataOptions(queryOptions);

    $.ajax({
        type: "GET",
        url: 'https://marvel.wikia.com/api.php?' + queryString,
        dataType: "json",
        success: function (data, textStatus, jqXHR) {
            character.setSecretIdentity(parseSecretIdentity(data));
            // character.secretIdentity = parseSecretIdentity(data);
            // console.log(character.secretIdentity);
            // character.debutArr = retrieveDebutComics(character);
            character.setDebutArr( retrieveDebutComics(character) );
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
function parseSecretIdentity(result){
    var key = 0;
    for(i in result.query.pages)
    key = i;
    
    // PAGES = -1 FOR ERROR
    console.log('result: ', result);
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
    return identity;
}



 /**
  * retrieveDebut
  * searches the Marvel wiki for a character name (based on their true identity) and will retrieve
  *     information on the character from which their first appearance/debut comic will be extracted.
  * @param {object} character - character object that contains secretIdentity that will be used to
  *     retrieve debuts
//   * @returns {array} an array of comics that the character debuts in
  */
function retrieveDebutComics(character){
    var queryOptions = {
        format: 'json',
        action: 'query',
        prop: 'revisions',
        rvprop: 'content',
        rvsection: '0',
        callback: '?',
        titles: encodeURIComponent(character.secretIdentity),
        redirects: ''
    };

    var queryString = parseDataOptions(queryOptions);

    $.ajax({
        type: "GET",
        url: 'https://marvel.wikia.com/api.php?' + queryString,
        dataType: "json",
        success: function (data, textStatus, jqXHR) {
            // var debut = parseWikiAndExtractDebut(data);
            character.debutArr = parseDebutComics(data);
            console.log('character: ', character);
            displayResults(character);
            // return debut;
        },
        error: function (errorMessage) {
            // need to return something in case there is an error
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
function parseDebutComics(result){
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

    // console.log("debutArr: ", debutArr);
    return debutArr;
}


function displayResults(character){
    $('#identity').empty();
    $('#debut').empty();

    $('#identity').append(character.getSecretIdentity());
    var debutComics = character.getDebutArr();
    for(var i = 0; i < debutComics.length; i++){
        var comic = $('<p>').text(debutComics[i]);
        $('#debut').append(comic);
    }
    
}
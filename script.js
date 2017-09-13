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
Character.prototype.setDebutImg = function(debutImg){
    this.debutImg = debutImg;
}
Character.prototype.getName = function(){
    return this.name;
}
Character.prototype.getSecretIdentity = function(){
    return this.secretIdentity;
}
Character.prototype.getDebutArr = function(){
    return this.debutArr;
}
Character.prototype.getDebutImg = function(){
    return this.debutImg;
}


$(document).ready(function(){
    // gatherInfo("Thing");
    // gatherInfo("Venom");
    // gatherInfo("Spider-Man");
    applyEventHandlers();
});

function applyEventHandlers(){
    $('#submit').click(submitForm);
}

function submitForm(){
    // console.log('submit');
    var charName = $("#charName").val();
    gatherInfo(charName);
}

/**
 * @param {string} characterName - name of character
 */
function gatherInfo(characterName){
    var character = new Character(characterName);
    retrieveIdentity(character);
}

/**
 * parse together data options to create query string for calls to wikia API
 * @param {object} data - an object holding properties 
 */
function parseDataOptions(titlesValue){
    var data = {
        format: 'json',
        action: 'query',
        prop: 'revisions',
        rvprop: 'content',
        rvsection: '0',
        callback: '?',
        titles: encodeURIComponent(titlesValue),
        redirects: ''
    };

    var queryString = "";
    for(var i = 0; i < Object.keys(data).length; i++){
        queryString += Object.keys(data)[i] + "=" + data[Object.keys(data)[i]] + "&";
    }
    // remove final ampersand from end of query string
    queryString = queryString.substring(0, queryString.length - 1);
    return queryString;
}


/**
 * parse together data options to create query string for calls to wikia API
 * @param {object} data - an object holding properties 
 */
function parseDataOptions2(titlesValue){
    var urlBase = 'File:';
    var title = encodeURIComponent(titlesValue);
    var data = {
        format: 'json',
        action: 'query',
        prop: 'imageinfo',
        iiprop: 'url',
        callback: '?',
        titles: urlBase + title,        
        redirects: ''
    };

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
    var queryString = parseDataOptions(character.getName());

    $.ajax({
        type: "GET",
        url: 'https://marvel.wikia.com/api.php?' + queryString,
        dataType: "json",
        success: function (data, textStatus, jqXHR) {
            var identityContent = parseSecretIdentity(data);
            if(identityContent.success){
                // no errors
                character.setSecretIdentity(identityContent.identity);
                retrieveDebutComics(character);
            }else{
                // display the error message
                displayError(identityContent.errorMessage);
            }
            
        },
        error: function (errorMessage) {
        }
    });
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
    var queryString = parseDataOptions(character.getSecretIdentity());

    $.ajax({
        type: "GET",
        url: 'https://marvel.wikia.com/api.php?' + queryString,
        dataType: "json",
        success: function (data, textStatus, jqXHR) {
            //parser should return success or failure upon determining if correct
                //information was retrieved
            var debutContent = parseDebutComics(data);
            if(debutContent.success){
                // no errors
                character.setDebutArr(debutContent.debutList);
                retrieveDebutComicFileName(character);
                // displayResults(character);
            }else{
                // display the error message
                displayError(debutContent.errorMessage);
            }            
        },
        error: function (errorMessage) {
            // need to return something in case there is an error
        }
    });
}

/**
 * 
 * @param {*} character 
 */
function retrieveDebutComicFileName(character){
    var queryString = parseDataOptions(character.getDebutArr()[0]);

    $.ajax({
        type: "GET",
        url: 'https://marvel.wikia.com/api.php?' + queryString,
        dataType: "json",
        success: function (data, textStatus, jqXHR) {
            //parser should return success or failure upon determining if correct
                //information was retrieved
            var comicContent = parseImageTitle(data);
            if(comicContent.success){
                // no errors
                var imageFileName = comicContent.comic;
                retrieveDebutComicImageURL(character, imageFileName);
            }else{
                // display the error message
                displayError(comicContent.errorMessage);
            }            
        },
        error: function (errorMessage) {
            // need to return something in case there is an error
        }
    });
}

/**
 * will find the complete path to the image for the first of the debut comics
 * @param {*} fileName 
 */
function retrieveDebutComicImageURL(character, fileName){
    var queryString = parseDataOptions2(fileName);

    $.ajax({
        type: "GET",
        url: 'https://marvel.wikia.com/api.php?' + queryString,
        dataType: "json",
        success: function (data, textStatus, jqXHR) {
            //parser should return success or failure upon determining if correct
                //information was retrieved
            var imageContent = parseImageURL(data);
            if(imageContent.success){
                // no errors
                character.setDebutImg(imageContent.imageSrc);
                displayResults(character);
            }else{
                // display the error message
                displayError(imageContent.errorMessage);
            }            
        },
        error: function (errorMessage) {
            // need to return something in case there is an error
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
    // console.log('result: ', result);
    var key = 0;
    var identityObj = {
        success: false,
    };
    for(i in result.query.pages)
    key = i;
    
    if(key === "-1"){
        // call was unsuccessful
        identityObj.success = false;
        identityObj.errorMessage = 'Could not find page for character';
        return identityObj;
    }else{
        // call was successful
        identityObj.success = true;
        content = result.query.pages[key].revisions[0]['*'];
        
        console.log('content: ', content);

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
        identityObj.identity = identity;
        return identityObj;
    }
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
    var debutObj = {
        success: false,
    };

    for(i in result.query.pages)
    key = i;
    
    if(key === "-1"){
        // call was unsuccessful
        debutObj.success = false;
        debutObj.errorMessage = 'Could not find debut comics';
        return debutObj;
    }else{
        // call was successful
        debutObj.success = true;
        debutObj.debutList = [];
        var content = result.query.pages[key].revisions[0]['*'];
        // console.log('content: ', content);

        var debut = content.match(/\| First.*=\s(.*)/g);

        // format first debut
        var delimiter = '= ';
        var startIndex = debut[0].indexOf(delimiter);
        debutObj.debutList.push(debut[0].substring(startIndex + delimiter.length));
        
        // check to see if there is more than one debut
        if(debut.length > 1){
            // extract further debuts
            // pattern: {{cid|"text to grab"}}("more text to grab")
            var pattern = /\{\{cid\|(.*?)\}\}(\(.*?\))/g;
            var extraDebuts = null;
        
            while( (extraDebuts = pattern.exec(debut[1])) !== null){
                debutObj.debutList.push(`${extraDebuts[1]} ${extraDebuts[2]}`);
            }
        }
    
        return debutObj;
    }
    
}

function parseImageTitle(result){
    // console.log('result: ', result);

    var key = 0;
    var comicObj = {
        success: false,
    };
    for(i in result.query.pages)
    key = i;
    
    if(key === "-1"){
        // call was unsuccessful
        comicObj.success = false;
        comicObj.errorMessage = 'Could not find image.';
        return comicObj;
    }else{
        // call was successful
        comicObj.success = true;
        content = result.query.pages[key].revisions[0]['*'];
        // console.log('content: ', content);


        var pattern = /\| Image\s*=\s(.*)/g;
        // var comic = pattern.exec(content)[1];
        // comicObj.comic = encodeURIComponent(comic);

        comicObj.comic = pattern.exec(content)[1];

        return comicObj;
    }
}

function parseImageURL(result){
    // console.log('result: ', result);

    var key = 0;
    var imageObj = {
        success: false,
    };
    for(i in result.query.pages)
    key = i;
    
    if(key === "-1"){
        // call was unsuccessful
        imageObj.success = false;
        imageObj.errorMessage = 'Could not find image.';
        return imageObj;
    }else{
        // call was successful
        imageObj.success = true;
        imageObj.imageSrc = result.query.pages[key].imageinfo[0].url;

        // console.log('content: ', content);


        // var pattern = /\| Image\s*=\s(.*)/g;
        // var comic = pattern.exec(content)[1];
        // // comic = comic.replace(" ", "_");
        // comic = encodeURIComponent(comic);
        // // var urlBase = 'https://vignette.wikia.nocookie.net/marveldatabase/images/';
        // console.log('content: ', content);
        
        return imageObj;
    }
}

function clearResultsAndStatus(){
    $('#identity').empty();
    $('#debut').empty();
    $('#status').empty();
}

function displayResults(character){
    clearResultsAndStatus();
    $('#identity').append(character.getSecretIdentity());
    var debutComics = character.getDebutArr();
    var img = $('<img>').attr('src', character.getDebutImg());
    $('#debut').append(img);
    for(var i = 0; i < debutComics.length; i++){
        var comic = $('<p>').text(debutComics[i]);
        $('#debut').append(comic);
    }
    
}

function displayError(errorMessage){
    clearResultsAndStatus();
    $('#status').append(errorMessage);
}
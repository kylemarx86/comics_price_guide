function Character(name) {
    this.name = toTitleCase(name);
    this.realName = null;
    this.debutArr = [];
}
Character.prototype.setRealName = function(realName){
    this.realName = realName;
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
Character.prototype.getRealName = function(){
    return this.realName;
}
Character.prototype.getDebutArr = function(){
    return this.debutArr;
}
Character.prototype.getDebutImg = function(){
    return this.debutImg;
}

/**
 * special uppercasing function to capitalize beginnings of words and words that start after hyphen
 * @param {string} str - string to change to special uppercase
 */
function toTitleCase(str){
    return str.replace(/[^\s-]*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
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
    retrieveRealName(character);
}

/**
 * parse together data options to create query string for calls to wikia API
 * @param {string} titlesValue - title of the page to be searched for
 * @param {object} extraDataOptions - an object holding key value pairs for extra data options not standard to all call
 */
function constructQueryString(titlesValue, extraDataOptions){
    // base data incorporated in all calls to wikia API
    var data = {
        format: 'json',
        action: 'query',
        callback: '?',
        titles: encodeURIComponent(titlesValue),
        redirects: ''
    };
    // add extra key value pairs into data object
    for(var key in extraDataOptions){
        if(extraDataOptions.hasOwnProperty(key)){
            data[key] = extraDataOptions[key];
        }
    }
    // construct query string from data object's key value pairs
    var queryString = "";
    for(var i = 0; i < Object.keys(data).length; i++){
        queryString += Object.keys(data)[i] + "=" + data[Object.keys(data)[i]] + "&";
    }
    // remove final ampersand from end of query string
    queryString = queryString.substring(0, queryString.length - 1);
    return queryString;
}

 /**
  * retrieveRealName
  * searches Marvel wiki for mantle and will retrieve information on the character from which their real identity will be extracted
  * @param {object} character - character object containing name of character to be looked up
  */
function retrieveRealName(character){
    var extraDataOptions = {
        prop: 'revisions',
        rvprop: 'content',
        rvsection: '0',
    };
    var queryString = constructQueryString(character.getName(), extraDataOptions);

    $.ajax({
        type: "GET",
        url: 'https://marvel.wikia.com/api.php?' + queryString,
        dataType: "json",
        success: function (data, textStatus, jqXHR) {
            var realNameObj = parseRealName(data);
            if(realNameObj.success){
                // no errors - single character retrieved
                character.setRealName(realNameObj.realName);
                retrieveDebutComics(character);
            }else{
                // an error occured

                // display the error message
                displayError(realNameObj.errorMessage);
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
  * @param {object} character - character object that contains realName that will be used to
  *     retrieve debuts
//   * @returns {array} an array of comics that the character debuts in
  */
function retrieveDebutComics(character){
    var extraDataOptions = {
        prop: 'revisions',
        rvprop: 'content',
        rvsection: '0',
    };
    var queryString = constructQueryString(character.getRealName(), extraDataOptions);

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
                console.log('character: ', character);
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
 * @param {object} character 
 */
function retrieveDebutComicFileName(character){
    // remove any # signs for correct formatting when parsed
    var debutFormatted = character.getDebutArr()[0].replace("#", "");
    console.log('debutFormatted: ', debutFormatted);
    var extraDataOptions = {
        prop: 'revisions',
        rvprop: 'content',
        rvsection: '0',
    };
    var queryString = constructQueryString(debutFormatted, extraDataOptions);

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
                // // display the error message
                // displayError(comicContent.errorMessage);
            }            
        },
        error: function (errorMessage) {
            // need to return something in case there is an error
        }
    });
}

/**
 * will find the complete path to the image for the first of the debut comics
 * @param {object} character - 
 * @param {string} fileName - 
 * */
function retrieveDebutComicImageURL(character, fileName){
    var extraDataOptions = {
        prop: 'imageinfo',
        iiprop: 'url',
    };
    var queryString = constructQueryString("File:"+fileName, extraDataOptions);

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
 * will find the complete path to the image for the first of the debut comics
 * @param {*} image - location on DOM that will have its source attribute replaced
 * @param {string} fileName - 
 */
function retrieveImageURL(image, fileName){
    var extraDataOptions = {
        prop: 'imageinfo',
        iiprop: 'url',
    };
    var queryString = constructQueryString("File:"+fileName, extraDataOptions);

    $.ajax({
        type: "GET",
        url: 'https://marvel.wikia.com/api.php?' + queryString,
        dataType: "json",
        success: function (data, textStatus, jqXHR) {
            
            // //parser should return success or failure upon determining if correct
            //     //information was retrieved
            var imageContent = parseImageURL(data);
            if(imageContent.success){
                // no errors
                
                // // display image result
                // displayImage(imageContent.imageSrc);

                // return the object with success and parsed imageURL
                console.log('image')
                return imageContent;

                // displayResults(character);
            }else{
                // display the error message
                return
                displayError(imageContent.errorMessage);
            }
        },
        error: function (errorMessage) {
            // need to return something in case there is an error
            imageContent = {
                success: false
            }
        }
    });
}

/**
 * extracts the real name of the most relavant character from the disambiguation page of the wiki
 * @param {*} result - json object from wikia API containing disambiguation on characters
 */
function parseRealName(result){
    // console.log('result: ', result);
    var key = 0;
    var realNameObj = {
        success: false,
    };
    for(i in result.query.pages)
    key = i;
    
    if(key === "-1"){
        // call was unsuccessful
        realNameObj.success = false;
        realNameObj.errorMessage = 'Could not find page for character';
        return realNameObj;
    }else{
        // call was successful
        content = result.query.pages[key].revisions[0]['*'];

        // off for now
        // console.log('content: ', content);

        // when searching for most characters there will be a disambiguation page the character in alternate realities (it's a comics thing)
        // we wish to find the character in the most relevant reality (it's a comics thing)
        // for most pages this will be found under the section Main Character (see )
        // others will list this under RealName (see R'tee), (I don't know how often this case comes up but I am accounting for it)
        // if these tests fail, but there is still info to work with, it will be a true disambiguation page with many different characters (see Meteor)

        var pattern = /Main Character\s*=\s\[\[([^\|]*)\|?.*\]\]/g;
        var matchResults = pattern.exec(content);
        if(matchResults !== null){
            // page is not a disambiguation page
            // character found
            realNameObj.success = true;
            
            var realName = matchResults[1];
            // check to ensure real name is from main universe (Earth-616)
            var searchStr = " (Earth-616)";
            if(realName.indexOf(searchStr) < 0){
                // if not found concatenate searchStr to realName
                realName += searchStr;
            }
            realNameObj.realName = realName;
            return realNameObj;
        }else{
            // patter for some character's real name
            var pattern = /RealName\s*=\s(.*)/g;
            var matchResults = pattern.exec(content);

            if(matchResults !== null){
                // page is not a disambiguation page but is of second pattern
                // character found
                realNameObj.success = true;

                var realName = matchResults[1];
                // check to ensure real name is from main universe (Earth-616)
                var searchStr = " (Earth-616)";
                if(realName.indexOf(searchStr) < 0){
                    // if not found concatenate searchStr to realName
                    realName += searchStr;
                }
                realNameObj.realName = realName;
                return realNameObj;
            }else{
                // page is a true disambiguation page
                console.log(content);
                realNameObj.success = false;
                realNameObj.errorMessage = 'Disambiguation page reached. Choose one of these characters.';
                // New Header1 denotes a character
                // var pattern = /New Header1_[\d]*\s*=\s\[\[([\w.'() -]*)\|?.*\]\]/g;      //working
                var pattern = /New Header1_[\d]*\s*=\s\[\[([\w.'() -]*)\|?.*\]\]; (.*)/g;    //with images??

                // gather all names and image titles in disambiguation page
                realNameObj.pages = parseDisambiguation(pattern, content);
                
                // var characterArr = null;
                // realNameObj.charList = [];
                // while( (characterArr = pattern.exec(content)) !== null){
                //     realNameObj.charList.push(characterArr[1]);
                // }

                // console.log('charList: ', realNameObj.charList);
                
                return realNameObj;
            }
    
        }
    }
}

/**
 * returns an array of objects holding information on disambiguation pages including title and image
 * @param {*} pattern - regex pattern to test
 * @param {string} content - content to check against regex pattern
 */
function parseDisambiguation(pattern, content){
    var tempMatchArr = null;
    matchArr = [];
    while( (tempMatchArr = pattern.exec(content)) !== null){
        tempObj = {};
        tempObj.page = tempMatchArr[1];
        tempObj.img = tempMatchArr[2];
        matchArr.push(tempObj);
    }
    // console.log('matchArr: ', matchArr);
    return matchArr;
}

/**
 * takes the result from the character page on the wiki and searches for and extracts the debut comic for the character
 * 
 * comments: comics are weird in that there can be multiple first appearances/debuts for a character
 * A character can appear with a cameo in an early comic, then appear later in full (for instance Venom)
 * Also a character can take different mantle or identity (for instance, Falcon (Sam Wilson) has
 *      has taken up the mantle of Captain America, traditionally Steve Rogers, at times)
 * @param {*} result - json object from wikia API containing character information
 */
function parseDebutComics(result){
    // console.log('result: ', result);
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
        debutObj.debutList = [];
        var content = result.query.pages[key].revisions[0]['*'];
        // console.log('content: ', content);

        var debut = content.match(/\| First.*=\s(.*)/g);
        if(debut !== null){
            debutObj.success = true;
            // console.log(debut);
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
        }else{
            // what does it mean if there is no first appearance listed???
        }
    }
}

/**
 * 
 * @param {object} result - json object
 */
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
        // comicObj.comic = pattern.exec(content)[1];
        var imageTitle = content.match(pattern);

        if(imageTitle !== null){
            comicObj.success = true;
            comicObj.imageTitle = imageTitle;
            return comicObj;
        }else{
            // page is a disambiguation page
            comicObj.success = false;
            comicObj.errorMessage = 'Disambiguation page reached. Choose one of these comics.';
            // New Header2 denotes a comic or comic volume
            // var pattern = /New Header1_[\d]*\s*=\s\[\[([^\|]*)\|?.*\]\]/g;  //old
            // var pattern = /New Header2_[\d]*\s*=\s\[\[([\w.'() -]*)\|?.*\]\]/g;  // working
            var pattern = /New Header2_[\d]*\s*=\s\[\[([\w.'() -]*)\|?.*\]\]; (.*)/g;
            // console.log(content);

            // gather all names in disambiguation page
            comicObj.pages = parseDisambiguation(pattern, content);
            console.log('pages: ', comicObj.pages)
            // var pages = parseDisambiguation(pattern, content);

            // content = [];
            // for(var i = 0; i < comicObj.comicArr.length; i++){
            for(var i = 0; i < comicObj.pages.length; i++){
                // for each page represented in disambiguation page, display image and title of page
                var $div = $('<div>').addClass('comic');
                // var $img = $('<img>').attr('src', retrieveImageURL(comicObj.pages[i].img));
                retrieveImageURL($img, comicObj.pages[i].img)
                var $title = $('<p>').text(comicObj.pages[i].page);
                // retrieveImageURL(comicObj.comicArr[i][1]);
                // retrieveImageURL(comicObj.pages[i].img);
                // assignImageSrc();
                $div.append($img, $title);
                $('#debut').append($div);
                
                // content.push(retrieveImageURL(comicObj.comicArr[i][1]));
            }

            // console.log('comicList: ', comicObj.comicArr);
            
            return comicObj;
        }
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

        // console.log('imageObj.imageSrc: ', imageObj.imageSrc);
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
    $('#identity').append(character.getRealName());
    var debutComics = character.getDebutArr();
    var img = $('<img>').attr('src', character.getDebutImg());
    $('#debut').append(img);
    for(var i = 0; i < debutComics.length; i++){
        var comic = $('<p>').text(debutComics[i]);
        $('#debut').append(comic);
    }
    
}

function displayImage(imageSource){
    var img = $('<img>').attr('src', imageSource);
    $('#debut').append(img);
}

function displayError(errorMessage){
    clearResultsAndStatus();
    $('#status').append(errorMessage);
}
/**
 * Search object is based on the fact that there are multiple templates in the marvel wiki
 * Available templates from wiki: comic, character, team, gallery, organization, location, vehicle,
 *  item, race, reality, event, storyline, television episode, marvel staff, image, novel, user page
 * The scope of this project will focus on and make use of the following templates: comic, character, 
 *  team, gallery, organization, location, vehicle, item, race, event, storyline, image
 * All searchable things will have a properName related to the page devoted to it on the wiki.
 * (not sure yet) All searchable things will also have a reality associated for them to aide in keeping track of pages. 
 *  Since the scope of this project relates to comic books, different realities for stories may exist so it
 *  will be important to keep track of these to ensure we get correct data in the end.
 * All searches will also all have a debutArr which will contain an array of objects each representing a debut
 *  Since the scope of this project relates to comic books, characters can carry different mantles, teams 
 *  can have different iterations, etc. Thus, an array of debuts is possible despite the usual conotations of the 
 *  word meaning first. For the purposes of this project I will keep track of as many of these debuts as possible,
 *  keeping track of associated information like debut comic, its significance, and its image.
 *   
 * @param {string} title - title of the thing to be searched on the wiki
 */
function Search(title) {
    this.title = title;
    this.properName = null;
    this.type = null;
    this.reality = null;
    this.debutArr = [];
}

/**
 * Special uppercasing function to capitalize beginnings of words and words that start after hyphen
 * Only to be used on titles coming from the user and NOT on information coming from the wiki itself,
 *   as this can affect the proper calls going to the wiki on further iterations.
 */
Search.prototype.toTitleCase = function(){
    var str = this.title;
    // convert all words to have uppercase first letter
    var allWordsCaps = str.replace(/[^\s-\(\)]*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
    // array of words that should not be capitalized
    var lowerCaseWordsArr = ['The', 'Of', 'And'];
    // convert words that are not to be capitalized into lowercase
    for(var i = 0; i < lowerCaseWordsArr.length; i++){
        allWordsCaps = allWordsCaps.replace(lowerCaseWordsArr[i], lowerCaseWordsArr[i].toLowerCase());
    }
    this.title = allWordsCaps;
}
// setter functions
Search.prototype.setProperName = function(properName){
    this.properName = properName;
}
Search.prototype.setType = function(type){
    this.type = type;
}
Search.prototype.setReality = function(reality){
    this.reality = reality;
}
Search.prototype.setDebutArr = function(debutArr){
    this.debutArr = debutArr;
}
// Search.prototype.setDebutImg = function(debutImg){
//     this.debutImg = debutImg;
// }
// getter functions
Search.prototype.getTitle = function(){
    return this.title;
}
Search.prototype.getProperName = function(){
    return this.properName;
}
Search.prototype.getType = function(){
    return this.type;
}
Search.prototype.setReality = function(reality){
    this.reality = reality;
}
Search.prototype.getDebutArr = function(){
    return this.debutArr;
}
// Search.prototype.getDebutImg = function(){
//     return this.debutImg;
// }



function Debut(comic, year, img, sig){
    this.comic = comic;
    this.year = year;
    this.img = img;
    this.sig = sig;
}


$(document).ready(function(){
    applyEventHandlers();
});

function applyEventHandlers(){
    $('#submit').click(submitForm);
}

function submitForm(){
    clearResultsAndStatus();
    var searchTerm = $("#searchTerm").val();
    gatherInfo(searchTerm);
}

/**
 * starts chain of 
 * @param {string} searchTerm - term to be searched in the wiki
 */
function gatherInfo(searchTerm){
    var searchObj = new Search(searchTerm);
    searchObj.toTitleCase();
    initialWikiQuery(searchObj);
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
  * initialWikiQuery
  * searches Marvel wiki for term and will call another function to parse information returned
  * @param {object} searchObj - search object containing name of term to be looked up
  */
  function initialWikiQuery(searchObj){
    var extraDataOptions = {
        prop: 'revisions',
        rvprop: 'content',
        rvsection: '0',
    };
    // NOTE: first parameter will change
    var queryString = constructQueryString(searchObj.getTitle(), extraDataOptions);  

    $.ajax({
        type: "GET",
        url: 'https://marvel.wikia.com/api.php?' + queryString,
        dataType: "json",
        success: function (data, textStatus, jqXHR) {
            data = generalParser(data);
            if(data.success){
                var content = data.content;
                var pageFormatObj = determinePageFormat(content);
                $('#status').text(`Search for ${searchObj.getTitle()}`);

                if(pageFormatObj.success){
                    if(pageFormatObj.pageType === 'template'){
                        // content is for a template page
                        // console.log('content: ', content);
                        
                        // get type of page/search
                        var $type = $('<p>').text(`Type: ${pageFormatObj.templateType}`);
                        // get image title
                        var $img = $('<img>');
                        var imageTitle = parseImageTitle(content);
                        if(imageTitle !== null){
                            retrieveImageURL($img, imageTitle);
                        }else{
                            $img.attr('src', './resources/image_not_found.png');
                        }
                        // add type and image to the DOM
                        $('#info').append($type, $img);

                        // check to see if we can parse out debut issues based on the type of template the page used
                        //   since not all page templates have information on first appearances
                        if( pageCanRunDebutCheck(pageFormatObj.templateType) ){
                            // get debut issues and display them
                            var debutInfo = parseDebut(content);
                            if(debutInfo.success){
                                $('#debut').text('Debut:');
                                for(var i = 0; i < debutInfo.debutList.length; i++){
                                    // for each debut add already gathered info to screen and search wiki for images of debut comic
                                    var $debut = $('<div>').addClass('debutEntry')
                                    var $issue = $('<div>').text(debutInfo.debutList[i].issue);
                                    var $img = $('<img>');
                                    if(debutInfo.debutList[i].mantle !== null){
                                        var $mantle = $('<div>').text(debutInfo.debutList[i].mantle);
                                        $debut.append($mantle);
                                    }
                                    $debut.append($issue, $img);
                                    $('#debut').append($debut);
                                    searchWikiForComic($img, debutInfo.debutList[i].issue);
                                }
                            }
                        }else{
                            console.log("This type of page does not typically have debuts")
                        }
                        
                    }else if(pageFormatObj.pageType === 'charDisambiguation'){
                        // content is for a character disambig
                            // run again to get debut issues
                        // create a temp search obj
                            // this object will run through a second time and return with an content from of a template pageType
                            // and will gather the rest of the desired information                         
                        var tempSearchObj = new Search(pageFormatObj.character);
                        initialWikiQuery(tempSearchObj);
                    }else{
                        // content is for a general disambig
                        // add the page titles and images to the DOM
                        for(var i = 0; i < pageFormatObj.pages.length; i++){
                            $div = $('<div>');
                            var $page = $('<p>').text(pageFormatObj.pages[i].page);
                            var $img = $('<img>');
                            $div.append($page, $img);
                            retrieveImageURL($img, pageFormatObj.pages[i].img);     // final part should be imgTitle not img for clarity
                            $('#info').append($div);
                        }
                        // await user response to determine how search will proceed
                    }
                }else{
                    // unable to determine type of page content came from
                    // display error in status bar
                    $("#status").text('Unable to determine format of conent.');
                }
            }else{
                $('#status').text(data.errorMessage);
            }
        },  // end of success
        error: function (errorMessage) {
        }
    });
}

/**
 * Determines if a page can run a check for a debut comic based on the type of template the page is.
 * Types of templates that are exceptable to run checks for debut comics are Character, Team, 
 *   Organization, Location, Vehicle, Item, Race, Reality, Event, and Storyline
 * Unexceptable types of templates are Comic, Television Episode, Marvel Staff, Image, Novel, and User Page
 * If further page templates are created this will need to be edited.
 * @param {string} templateType - type of 
 * @return {boolean} 
 */
function pageCanRunDebutCheck(templateType){
    if(templateType == 'Character' 
        || templateType == 'Team' 
        || templateType == 'Organization' 
        || templateType == 'Location' 
        || templateType == 'Vehicle' 
        || templateType == 'Item' 
        || templateType == 'Race' 
        || templateType == 'Reality' 
        || templateType == 'Event' 
        || templateType == 'Storyline' 
    ){
        return true;
    }else{
        return false;
    }
}

// NOTE: pass another argument in, the term searched for so error message can contain it
function generalParser(response){
    var key = 0;
    var data = {
        success: false
    }
    
    for(i in response.query.pages)
    key = i;

    if(key < 0){
        // call was unsuccessful
        data.errorMessage = 'Could not find page for search term';
    }else{
        // call was successful
        data.success = true;
        data.content = response.query.pages[key].revisions[0]['*'];
    }
    return data;
}


 /**
  * searches the Marvel wiki for a specific comic to receive information on it.
  * @param {object} image - DOM object to update the source of once image URL is received from wiki
  * @param {object} comicTitle - title of the issue we are searching for on the wiki
  */
function searchWikiForComic(image, comicTitle){
    var extraDataOptions = {
        prop: 'revisions',
        rvprop: 'content',
        rvsection: '0',
    };
    comicTitle = comicTitle.replace('#', '');
    var queryString = constructQueryString(comicTitle, extraDataOptions);

    $.ajax({
        type: "GET",
        url: 'https://marvel.wikia.com/api.php?' + queryString,
        dataType: "json",
        success: function (data, textStatus, jqXHR) {
            //parser should return success or failure upon determining if correct information was retrieved
            var comicInfo = generalParser(data);
            if(comicInfo.success){
                // page information was received
                var imageTitle = parseImageTitle(comicInfo.content);
                if(imageTitle !== null){
                    retrieveImageURL(image, imageTitle);
                }else{
                    image.attr('src', './resources/image_not_found.png');
                }
            }else{
                // display the error message
                displayError(comicInfo.errorMessage);
            }
        },
        error: function (errorMessage) {
            // need to return something in case there is an error
        }
    });
}

/**
 * takes the result from the character page on the wiki and searches for and extracts the debut comic for the character
 * 
 * COMMENTS: comics are weird in that there can be multiple first appearances/debuts for a character
 * A character can appear with a cameo in an early comic, then appear later in full (for instance Venom)
 * Also a character can take different mantle or identity (for instance, Falcon (Sam Wilson) has
 *      has taken up the mantle of Captain America, traditionally Steve Rogers, at times)
 * @param {string} content - string of content from the wiki
 */
function parseDebut(content){
    var debutObj = {
        success: false,
        debutList: []
    }

    // first of two possible groupings to check for debuts 
    var placeHolder = null;
    var debutsTemp = [];    // temporary holder for information from regex tests 
    var pattern = /\| First\d?.*=\s(.*)/g;
    while( (placeHolder = pattern.exec(content)) !== null){
        debutsTemp.push(placeHolder[1]);
    }
    // check for how many debuts exist
    if(debutsTemp.length > 0){
        // only one debut found
        debutObj.success = true;
        // push the first and only grouping of the pattern found
        var debut = {
            issue: debutsTemp[0]
        }
        debutObj.debutList.push(debut);
        if(debutsTemp.length > 1){
            // multiple debuts found
            // decipher second grouping

            // add first mantle to first object in debutList in debutObj
            var pattern = /(?:\(|\{\{g\|)(?:as )?(.*?)(?:\)|\}\})/i     // pattern for working with parentheses and braces cases
            
            var mantle = pattern.exec(debutsTemp[1]);
            if(mantle !== null){
                debutObj.debutList[0].mantle = mantle[1];
            }

            // extract further debuts and add them to debutList in debutObj
            // pattern: {{cid|"issue to grab"}} "{{|g" or "(" as? "mantle to grab" "}}" or ")"
            // pretty sure I encountered some cases where the "as" was omitted in this pattern. 
            // NOTE: important to have "as" case-insensitive, hence the i-flag
            pattern = /\{\{cid\|(.*?)\}\}(?:\(|\{\{g\|)(?:as )?(.*?)(?:\)|\}\})/gi;     // pattern combining cases
            var extraDebuts = null;
        
            while( (extraDebuts = pattern.exec(debutsTemp[1])) !== null){
                var debut = {
                    issue: extraDebuts[1],
                    mantle: extraDebuts[2]
                }
                debutObj.debutList.push(debut);
            }
        }   // end multiple debuts
    }else{
        // no firsts found
        // error / null object
        debutObj.errorMessage = 'No debuts found';
    }
    return debutObj;
}

/**
 * will find the complete path to the image for the first of the debut comics
 * @param {*} image - location on DOM that will have its source attribute replaced
 * @param {string} fileName - name of file to search the wiki for
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
                // no errors - update image source
                image.attr('src', imageContent.imageSrc);
            }else{
                // display the error message and updated image source
                image.attr('src', './resources/image_not_found.png');
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

function parseImageTitle(content){
    var pattern = /\| Image\s*=\s?(.*)/g;
    var matchResults = pattern.exec(content);
    var imageTitle = null;

    if(matchResults !== null){
        imageTitle = matchResults[1];
    }
    return imageTitle;
}

function parseImageURL(result){
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

        return imageObj;
    }
}

/**
 * takes content from a wiki page and determines if it is a template page, a character disambiguation
 *   page, or a general disambiguation page. 
 * @param {string} content - all the content from the wiki for a given page
 */
function determinePageFormat(content){
    var formatObj = {
        success: true,
        pageType: null
    }
    // check if content is of a template format
    var pattern = /Marvel Database:\s?(.*) Template/g;
    var template = pattern.exec(content);
    if(template !== null){
        formatObj.pageType = 'template';
        formatObj.templateType = template[1];
        // NOTE: should grab image title too since others do
        formatObj.imageTitle = parseImageTitle(content);


        // pattern = /\| Image\s*=\s(.*)/g;
        // var image = pattern.exec(content);
        // if(image !== null){
        //     formatObj.imageTitle = image[1];
        // }else{
        //     formatObj.imageTitle = null;
        // }

    }else{
        // check if content is of type character disambiguation
        // var pattern = /Main Character\s*=\s\[\[([^\|]*)\|?.*\]\]; (.*)/g;   // with image title
        var pattern = /Main Character\s*=\s\[\[([^\|]*)\|?.*\]\];/g;   // no image title because second call will capture it
        var character = pattern.exec(content);
        if(character !== null){
            formatObj.pageType = 'charDisambiguation';
            formatObj.character = character[1];
            // formatObj.imageTitle = character[2];
        }else{
            // NOTE: this section looks odd and should probably be cleaned up
            // check if content is of type general disambiguation
            var pattern = /New Header1_[\d]*\s*=\s\[\[([\w.'() -]*)\|?.*\]\]; (.*)/g;    // with image title
            var disambiguation = parseDisambiguation(pattern, content);
            if(disambiguation !== null){
                formatObj.pageType = 'genDisambiguation';
                formatObj.pages = disambiguation;
                // console.log('disambiguation', disambiguation);
                // var imageTitle = disambiguation[]
                var $div = $('<div>').addClass('disambig');
                var $img = $('<img>');
                // retrieveImageURL


                // add images and titles to screen

            }else{
                // in case there is something that doesn't fit these patterns or page templates change
                formatObj.success = false;
            }
        }
    }
    return formatObj;
}

function clearResultsAndStatus(){
    $('#info').empty();
    $('#debut').empty();
    $('#status').empty();
}

/**
 * clear the status area and display the new error message
 * @param {string} errorMessage - message describing the error
 */
function displayError(errorMessage){
    $('#status').text(errorMessage);
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
 */
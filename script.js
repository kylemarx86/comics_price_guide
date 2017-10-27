/**
 * Search object is based on the fact that there are multiple templates in the marvel wiki (now expanded
 * to DC wiki, as well)
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
 * @property {string} title - 
 * * @property {string} properName - 
 * * @property {string} type - 
 * * @property {string} reality - 
 * * @property {string} debutArr - 
 * @property {string} publisher - keep track of publisher
 */
function Search(title) {
    this.title = title;
    this.properName = null;     // unused so far
    this.type = null;           // unused so far
    this.reality = null;        // unused so far
    this.debutArr = [];
    this.publisher = $('.switch-publisher').hasClass('marvel') ? 'marvel' : 'dc';
}

/**
 * Special uppercasing function to capitalize beginnings of words and words that start after hyphen
 * Only to be used on titles coming from the user and NOT on information coming from the wiki itself,
 *   as this can affect the proper calls going to the wiki on further iterations.
 */
Search.prototype.toTitleCase = function(){
    var str = this.title;
    // convert all words to have uppercase first letter
    var allWordsCaps = str.replace(/[^\s-\(\).]*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
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
Search.prototype.getReality = function(reality){
    return this.reality;
}
Search.prototype.getDebutArr = function(){
    return this.debutArr;
}
// Search.prototype.getDebutImg = function(){
//     return this.debutImg;
// }
Search.prototype.getPublisher = function(){
    return this.publisher;
}



function Debut(comic, year, img, sig){
    this.comic = comic;
    this.year = year;
    this.img = img;
    this.sig = sig;
}


$(document).ready(function(){
    applyEventHandlers();
    setFocus();     // for testing only??
});

function applyEventHandlers(){
    $('#submit').click(submitForm);
    $('#searchTerm').keydown(function(e){
        if(e.keyCode === 13){
            submitForm();
        }
    });
    $('.switch-publisher .lever').click(toggleActivePublisher);
    $('.switch-publisher .logo').click(toggleSwitchForActivePublisher);
}

function setFocus(){
    $('#searchTerm').focus();
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


// WIKI QUERY METHODS

 /**
  * initialWikiQuery
  * searches wiki for term and will call another function to parse information returned
  * @param {object} searchObj - search object containing name of term to be looked up
  * @param {string} [origSearchTerm] - term searched in previous search, for cases when a search yields inconclusive results and needs to be searched again
  */
  function initialWikiQuery(searchObj, origSearchTerm){
    // // for testing
    // if(origSearchTerm !== undefined){
    //     console.log('origSearchTerm', origSearchTerm)
    // }

    var extraDataOptions = {
        prop: 'revisions',
        rvprop: 'content',
        rvsection: '0',
    };
    // NOTE: first parameter will change
    var queryString = constructQueryString(searchObj.getTitle(), extraDataOptions);
    var publisher = searchObj.getPublisher();

    $.ajax({
        type: "GET",
        url: `https://${publisher}.wikia.com/api.php?${queryString}`,
        dataType: "json",
        success: function (data, textStatus, jqXHR) {
            // returns with object with success and other things
            data = generalParser(data, searchObj.getTitle());
            // console.log('data', data)
            if(data.success){
                var content = data.content.revisions[0]['*'];
                var pageFormatObj = determinePageFormat(content, publisher);
                $searchCrumb = $('<a>').addClass('breadcrumb').attr('href', '#!').text(searchObj.getTitle());
                $('#searchPath .col').append($searchCrumb);
                // add search to breadcrumbs

                if(pageFormatObj.success){
                    if(pageFormatObj.pageType === 'template'){
                        // content is for a template page
                        // console.log('content', content)

                        // create section header for type of page
                        var $type = $('<h4>').addClass('section-header').text(`Page type: ${pageFormatObj.templateType}`);
                        var $card = createCard('singleEntry', data.content.title);
                        var $img = $card.find('img');
                        var imageTitle = pageFormatObj.imageTitle;

                        // turn into separate method
                        if(imageTitle !== null){
                            retrieveImageURL($img, publisher, imageTitle);
                        }else{
                            $img.attr('src', './resources/image_not_found.png');
                        }
                        // add type and image to the DOM
                        $('#info .text').append($type);
                        $('#info .image').append($card);

                        // check to see if we can parse out debut issues based on the type of template the page used
                        //   since not all page templates have information on first appearances
                        if( pageCanRunDebutCheck(pageFormatObj.templateType) ){
                            // get debut issues and display them
                            checkForDebuts(content, publisher);
                        }else{
                            displayError("This type of page does not typically have debuts");
                            // ensure image is displayed
                        }
                        
                    }else if(pageFormatObj.pageType === 'charDisambiguation'){
                        // content is for a character disambig
                            // run again to get debut issues
                        // create a temp search obj
                            // this object will run through a second time and return with an content from of a template pageType
                            // and will gather the rest of the desired information                         
                        var tempSearchObj = new Search(pageFormatObj.character);
                        initialWikiQuery(tempSearchObj, searchObj.getTitle());
                    }else{
                        // content is for a general disambig
                        // create section header for page type
                        var $type = $('<h4>').addClass('section-header').text(`Page type: ${pageFormatObj.pageType}`);
                        $('#info .text').append($type);

                        // cards for each page need to be created and appended to the image area of the info section
                        for(var i = 0; i < pageFormatObj.pages.length; i++){
                            var $card = createCard('disambigEntry', pageFormatObj.pages[i].page);
                            retrieveImageURL($card.find('img'), publisher, pageFormatObj.pages[i].imageTitle);
                            $('#info .image').append($card);
                        }
                        // await user response to determine how search will proceed
                    }
                }else{
                    // unable to determine type of page content came from
                    // display error in status bar
                    displayError(pageFormatObj.errorMessage);
                }
            }else{
                displayError(data.errorMessage);
            }
        },  // end of success
        error: function (errorMessage) {
        }
    });
}

/**
 * 
 * @param {string} cardType - string representing class name being added to the card
 * @param {string} [pageTitle] - title of the page the card represents
 * @param {string} [imageInfo] - info text at the bottom of the card
 */
function createCard(cardType, pageTitle, imageInfo){
    var $col = $('<div>').addClass(cardType);
    var $card = $('<div>').addClass('card-piece');
    var $card_content = $('<div>').addClass('card-content white-text');
    // add pageTitle, if defined
    if(pageTitle !== undefined){
        var $title = $('<div>').addClass('card-title').text(pageTitle);
        $card_content.append($title);
    }
    // add image in container
    var $img_container = $('<div>').addClass('card-image');
    var $img = $('<img>');
    $img_container.append($img);
    $card_content.append($img_container);
    // add imageInfo, if defined
    if(imageInfo !== undefined){
        $image_info = $('<div>').addClass().text(imageInfo);
        $card_content.append($image_info);
    }
    $card.append($card_content);
    $col.append($card);
    return $col;
}

/**
  * searches wiki for a specific comic to receive information on it.
  * @param {object} $card - DOM object to update with thecover date and source of once image URL is received from wiki
  * @param {string} publisher - name of the publisher of comic. Used to determine which API to query
  * @param {object} comicTitle - title of the issue we are searching for on the wiki
  * @param {string} [origTitle] - title of comic in previous search, for cases when a search yields inconclusive results and needs to be searched again
  */
  function searchWikiForComic($card, publisher, comicTitle, origTitle){
    // // for testing
    // if(origTitle !== undefined){
    //     console.log('origTitle', origTitle)
    // }

    var extraDataOptions = {
        prop: 'revisions',
        rvprop: 'content',
        rvsection: '0',
    };
    comicTitle = comicTitle.replace('#', '');
    var queryString = constructQueryString(comicTitle, extraDataOptions);

    $.ajax({
        type: "GET",
        url: `https://${publisher}.wikia.com/api.php?${queryString}`,
        dataType: "json",
        success: function (data, textStatus, jqXHR) {
            //parser should return success or failure upon determining if correct information was retrieved
            var comicInfo = generalParser(data, comicTitle);
            var $img = $card.find('img');
            var $content = $card.find('.card-content');
            if(comicInfo.success){
                // page information was received
                var content  = comicInfo.content.revisions[0]['*'];
                // console.log('content: ', content);

                // check to see if this is a disambiguation page
                var pattern = /^\{\{Disambiguation/i;
                var test = content.match(pattern);
                if(test !== null){
                    // search for comic yields disambiguation
                    // display the error message
                    displayError(`Search for ${comicTitle} yielded disambiguation page.`);
                    // if page for comic is not found than neither is the image for it
                    $img.attr('src', './resources/image_not_found.png');
                    // attempt again with different call (namely with a volume inserted). 
                    // NOTE: This volume isn't necessarily the correct volume. The method always inserts volume 1
                    var newTitle = addVolumeToIssue(comicTitle);
                    if(newTitle !== null){
                        searchWikiForComic($card, publisher, newTitle, comicTitle);
                    }
                }else{
                    // successful search for comic
                    // find and add image
                    var imageTitle = parseImageTitle(content);
                    if(imageTitle !== null){
                        retrieveImageURL($img, publisher, imageTitle);
                    }else{
                        $img.attr('src', './resources/image_not_found.png');
                    }
                    
                    // find and add cover date
                    var coverDate = parseCoverDate(content);
                    if(coverDate !== null){
                        $div = $('<div>').addClass('cover-date').text(coverDate);
                        $content.append($div);
                    }

                    // remove old error message from status bar relating to not finding page for old search term, if any
                    if(origTitle !== undefined){
                        $( `#errors li:contains(${origTitle})` ).remove();
                        if( $('#errors li').length === 1){
                            $('#errors li').remove();
                            $('#errors').addClass('hide');
                        }
                    }
                }
            }else{
                // display the error message
                displayError(comicInfo.errorMessage);
                // if page for comic is not found than neither is the image for it
                image.attr('src', './resources/image_not_found.png');
                // attempt again with different call (namely with a volume inserted). 
                // NOTE: This volume isn't necessarily the correct volume. The method always inserts volume 1
                var newTitle = addVolumeToIssue(comicTitle);
                if(newTitle !== null){
                    searchWikiForComic($card, publisher, newTitle, comicTitle);
                }
            }
        },
        error: function (errorMessage) {
            // need to return something in case there is an error
            // if page for comic is not found than neither is the image for it
            image.attr('src', './resources/image_not_found.png');
        }
    });
}

/**
 * will find the complete path to an image on the wiki based on its title
 * @param {object} image - DOM object to update the source of once image URL is received from wiki
 * @param {string} publisher - name of publishing company. Used to determine which API to query
 * @param {string} fileName - name of file to search the wiki for
 */
function retrieveImageURL(image, publisher, fileName){
    var extraDataOptions = {
        prop: 'imageinfo',
        iiprop: 'url',
    };
    var queryString = constructQueryString("File:"+fileName, extraDataOptions);

    $.ajax({
        type: "GET",
        url: `https://${publisher}.wikia.com/api.php?${queryString}`,
        dataType: "json",
        success: function (data, textStatus, jqXHR) {
            // parser will return object with a link to the appropriate image to use: image from wiki for success and default image_not_found for failures
            var imageContent = parseImageURL(data);
            // imageContent.imageSrc will always contain correct src for image
            image.attr('src', imageContent.imageSrc);
            if(!imageContent.success){
                // display the error message 
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

// METHODS FOR PARSING

// NOTE: pass another argument in, the term searched for so error message can contain it
/**
 * 
 * @param {object} response - JSON response object from wiki
 * @param {object} searchTerm - Term searched in query to the wiki. Important for error messages
 * @returns {object} object with properties:
 *          {boolean} success - description of the call
 *          {string} content - content of the page queried from the wiki
 *          {string} errorMessage - message if query was unsuccessful
 */
function generalParser(response, searchTerm){
    var key = 0;
    var data = {
        success: false
    }
    for(i in response.query.pages)
    key = i;

    if(key < 0){
        // call was unsuccessful
        if(searchTerm !== undefined){
            data.errorMessage = `Could not find page for search term: ${searchTerm}`;
        }else{
            data.errorMessage = `Could not find page for search term.`;
        }
        
    }else{
        // call was successful
        data.success = true;
        data.content = response.query.pages[key];
    }
    return data;
}

/**
 * returns an array of objects holding information on disambiguation pages including title and image
 * @param {object} pattern - regex pattern object to test
 * @param {string} content - content from the wiki to check against regex pattern
 * @returns {array} array of objects containing titles of the pages found and the titles of the images associated with them
 *                  NOTE: if no matches of pattern caught, method will return an empty array.
 */
function parseDisambiguation(pattern, content){
    var tempMatchArr = null;
    matchArr = [];
    while( (tempMatchArr = pattern.exec(content)) !== null){
        tempObj = {};
        tempObj.page = tempMatchArr[1];
        tempObj.imageTitle = tempMatchArr[2];
        matchArr.push(tempObj);
    }
    return matchArr;
}

/**
 * takes the result from the character page on the wiki and searches for and extracts the debut comic for the character
 * @param {string} content - revision content from the wiki
 * @returns {object} object with properties:
 *          {boolean} success - description of the success of the parsing
 *          {array} debutList - array of debut comic objects with each with properties issue and mantle
 *          {string} errorMessage - message if the patterns were not found in the content
 */
function parseDebut(content){
    var debutObj = {
        success: false,
        debutList: null
    }

    // first of two possible groupings to check for debuts 
    var placeHolder = null;
    var debutsTemp = [];    // temporary holder for information from regex tests 
    var pattern = /\| First\d?.*=\s(.*)/g;
    // capture text related to debut issues
    while( (placeHolder = pattern.exec(content)) !== null){
        // prevent the pushing of empty strings to debuts
        if(placeHolder[1] !== ""){
            debutsTemp.push(placeHolder[1]);
        }
        // NOTE: consider creating exception if this second check fails 
    }
    // check for how many debuts exist
    if(debutsTemp.length > 0){
        // at least one debut found
        debutObj.success = true;
        debutObj.debutList = [];
        
        // check for complex pattern within first grouping
        // pattern: {{cid|"issue to grab"}} "{{|g" or "(" as? "mantle to grab" "}}" or ")"
        pattern = /\{\{cid\|(.*?)\}\}(?:\(|\{\{g\|)(?:as )?(.*?)(?:\)|\}\})/g;
        var extraDebuts = null;
        while( (extraDebuts = pattern.exec(debutsTemp[0])) !== null){
            var debut = {
                issue: extraDebuts[1],
                mantle: extraDebuts[2]
            }
            debutObj.debutList.push(debut);
        }

        if(debutObj.debutList.length === 0){
            // push the first and only grouping of the pattern found
            var debut = {
                issue: debutsTemp[0]
            }
            debutObj.debutList.push(debut);
        }

        if(debutsTemp.length > 1){
            // multiple debuts found
            // decipher second grouping

            // add first mantle to first object in debutList in debutObj
            pattern = /(?:\(|\{\{g\|)(?:as )?(?:\[\[)?(.*?)(?:\]\])?(?:\)|\}\})/i;      // pattern for working with parentheses and braces cases
            var mantle = pattern.exec(debutsTemp[1]);
            if(mantle !== null){
                debutObj.debutList[0].mantle = mantle[1];
            }

            // extract further debuts and add them to debutList in debutObj
            // pattern: {{cid|"issue to grab"}} "{{|g" or "(" as? "mantle to grab" "}}" or ")"
            // pretty sure there are some cases where the "as" was omitted in this pattern. 
            // NOTE: important to have "as" case-insensitive, hence the i-flag
            pattern = /\{\{cid\|(.*?)\}\}(?:\(|\{\{g\|)(?:as )?(?:\[\[)?(.*?)(?:\]\])?(?:\)|\}\})/gi;     // pattern combining cases
            var extraDebuts = null;
        
            while( (extraDebuts = pattern.exec(debutsTemp[1])) !== null){
                var debut = {
                    issue: extraDebuts[1],
                    mantle: extraDebuts[2]
                }
                debutObj.debutList.push(debut);
            }
        }   // end multiple debuts

        // run X-Men standardizer on debutObj
        debutObj = XMenStandardizer(debutObj);
    }else{
        // no firsts found
        // error / null object
        debutObj.errorMessage = 'No debuts found';
    }
    
    
    return debutObj;
}

/**
 * Extract the title of an image from the page content returned from the wiki.
 * NOTE: order of the primary and secondary searches is important because sometimes user entered 
 * data places images with numerical quantifiers (usually denoting secondary images) ahead of those 
 * without (usually denoting primary images).
 * @param {string} content - revision content from the wiki
 * @returns {string} imageTitle - title of the image being retrieved, or null if pattern not found
 */
function parseImageTitle(content){
    // primary search (look for images without numerical quantifiers)
    var pattern = /Image\s*=\s?(.*)/g;
    var matchResults = pattern.exec(content);
    var imageTitle = null;

    // if there are result
    if(matchResults !== null){
        // prevent the pushing of empty strings to images
        if(matchResults[1] !== ""){
            imageTitle = matchResults[1];
        }
        // NOTE: consider creating exception if this second check fails 
    }else{
        // secondary search
        pattern = /Image\d?\s*=\s?(.*)/g;
        matchResults = pattern.exec(content);
    
        // if there are result
        if(matchResults !== null){
            // prevent the pushing of empty strings to images
            if(matchResults[1] !== ""){
                imageTitle = matchResults[1];
            }
        }
    }
    // remove html from imageTitle (as long as imageTitle isn't null), just in case. (came across this on DC wiki)
    if(imageTitle !== null)
        imageTitle = imageTitle.replace(/<(?:.|\n)*?>/gm, '');

    return imageTitle;
}

/**
 * Parse out the cover date of a comic based on revision content from the wiki
 * @param {string} content - revision content from the wiki
 */
function parseCoverDate(content){
    var coverDate = null;
    var pattern = /Month\s*=\s?(.*)/g;
    var matchResults = pattern.exec(content);
    var month = null;
    
    if(matchResults !== null){
        // prevent the pushing of empty strings to coverDate
        if(matchResults[1] !== ""){
            month = matchResults[1];
            if( isNaN(month) ){
                month = month.substr(month, 3);
            }else{
                var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                month = months[month - 1];
            }
        }
        // NOTE: consider creating exception if this second check fails 
    }

    pattern = /Year\s*=\s?(.*)/g;
    matchResults = pattern.exec(content);
    var year = null;
    if(matchResults !== null){
        // prevent the pushing of empty strings to coverDate
        if(matchResults[1] !== ""){
            year = matchResults[1];
        }
        // NOTE: consider creating exception if this second check fails 
    }

    if(year !== null){
        coverDate = `${month} ${year}`;
    }
    return coverDate;
}


/**
 * Extract the URL source of an image featured on the wiki based on the results of a call to the wiki
 * @param {object} response - JSON object returned from the wiki based on a query for an image
 * @returns {object} object with properties:
 *          {boolean} success - description of the call
 *          {string} imageSrc - URL of the image
 *          {string} errorMessage - message if call was unsuccessful
 */
function parseImageURL(response){
    var data = generalParser(response);
    var imageObj = {
        success: data.success,
    };
        
    if(imageObj.success){
        // call was successful
        if(data.content.imageinfo !== undefined){
            imageObj.imageSrc = data.content.imageinfo[0].url;
        }else{
            imageObj.errorMessage = 'Could not find image.';
            imageObj.imageSrc = './resources/image_not_found.png';
        }
    }else{
        // call was unsuccessful
        imageObj.errorMessage = 'Could not find image.';
        imageObj.imageSrc = './resources/image_not_found.png';
    }
    return imageObj;
}

// HELPER METHODS

/**
 * parse together data options to create query string for calls to wikia API
 * @param {string} titlesValue - title of the page to be searched for
 * @param {object} extraDataOptions - an object holding key value pairs for extra data options not standard to all call
 * @returns {string} query string to send to the wiki
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
 * Takes content from a wiki page and determines if it is a template page, a character disambiguation
 *   page, or a general disambiguation page.
 * Possible further options for page types exist.
 * @param {string} content - revision content from the wiki
 * @param {string} publisher - name of the publisher of comic. Used to determine regex pattern to use in disambiguation
 * @returns {object} object with properties:
 *          {boolean} success - description of the whether the page's format could be discerned
 *          {string} pageType - type of page formatting either 'template', 'charDisambiguation' (character disambiguation), or 'disambiguation' (general disambiguation)            // look more into jsdocs to how to format this
 *          {string} templateType - used when pageType = 'template', describes the wiki's template that was used to create the page
 *          {string} imageTitle - used when pageType = 'template', title of the main image for the page
 *          {string} character - used when pageType = 'charDisambiguation', the name of the main character found
 *          {array} pages - used when pageType = 'disambiguation', array of objects (defined in the parseDisambiguation method)
 *          {string} errorMessage - message if call was unsuccessful
 * 
 * NOTE: CONSIDER CHANGING PAGE TYPE TO TWO WORD TERMS FOR USE IN OTHER METHODS
 */
function determinePageFormat(content, publisher){
    var formatObj = {
        success: true,
        pageType: null
    }
    // check if content is of a template format
    var pattern = /.* Database:\s?(.*) Template/g;

    var template = pattern.exec(content);
    if(template !== null){
        formatObj.pageType = 'template';
        formatObj.templateType = template[1];
        formatObj.imageTitle = parseImageTitle(content);
    }else{
        // check if content is of type character disambiguation
        var pattern = publisher === 'marvel' ? /Main Character\s*=\s\[\[([^\|\]]*)\|?.*/g : /MainPage\s*=\s?(.*)/g;
        var character = pattern.exec(content);
        if(character !== null){
            formatObj.pageType = 'charDisambiguation';
            formatObj.character = character[1];
        }else{
            // NOTE: this section looks odd and should probably be cleaned up
            // check if content is of type general disambiguation
            var pattern = /New Header1_[\d]*\s*=\s\[\[([\w.'() -]*)\|?.*\]\]; (.*)/g;    // with image title capture group
            var disambiguation = parseDisambiguation(pattern, content);         // method should always be returning an array
            if(disambiguation.length !== 0){
                formatObj.pageType = 'disambiguation';
                formatObj.pages = disambiguation;
            }else{
                // in case there is something that doesn't fit these patterns or page templates change
                formatObj.success = false;
                formatObj.errorMessage = 'Could not recognize page formatting';
            }
        }
    }
    return formatObj;
}




/**
 * Determines if a page can run a check for a debut comic based on the type of template the page is.
 * Types of templates that are exceptable to run checks for debut comics are Character, Team, 
 *   Organization, Location, Vehicle, Item, Race, Reality, and Storyline
 * Unexceptable types of templates are Comic, Event (because of different formatting), Television Episode, Marvel Staff, Image, Novel, and User Page
 * If further page templates are created this will need to be edited.
 * @param {string} templateType - type of 
 * @return {boolean} a Boolean description of whether we should run a check to find a debut comic
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
        || templateType == 'Storyline' 
    ){
        return true;
    }else{
        return false;
    }
}

/**
 * Check for debuts and display them if the exist
 * @param {string} content - content of the page queried from the wiki
 * @param {string} publisher - name of the publisher of comic. Used to determine which API to query
 */
function checkForDebuts(content, publisher){
    var debutInfo = parseDebut(content);
    if(debutInfo.success){
        // create section header debuts
        var $title = $('<h4>').addClass('section-header').text(`Debut${debutInfo.debutList.length > 1 ? 's' : ''}`);

        // create row for debut entries
        var $entries = $('<div>').addClass('row');
        $('#debut').append($title, $entries);

        for(var i = 0; i < debutInfo.debutList.length; i++){
            // for each debut add already gathered info to screen and search wiki for images of debut comic
            var mantle = (debutInfo.debutList[i].mantle !== null) ? debutInfo.debutList[i].mantle : '' ;
            var $card = createCard('debutEntry', mantle, debutInfo.debutList[i].issue);
            $entries.append($card);
            searchWikiForComic($card, publisher, debutInfo.debutList[i].issue);
        }
    }else{
        displayError(debutInfo.errorMessage);
    }
}

/**
 * attempt to insert a volume number (1) into the title string
 * returns null if it cannot find the pattern
 * NOTE: This method could be problematic because it always assumes a missing volume number implies volume 1
 * @param {string} title - original title of the issue checked
 * @returns {string} title of the issue with extra text related to volume number, or returns null
 */
function addVolumeToIssue(title){
    var pattern = /.*Vol \d+.*/gi;
    var temp = title.match(pattern);
    if(temp !== null){
        // found volume
        return null;
    }else{
        // volume not found
        pattern = /(.*) ([\d.]+)\s{0,}$/;
        temp = pattern.exec(title);
    
        if(temp !== null){
            return `${temp[1]} Vol 1 ${temp[2]}`;
        }else{
            return null;
        }
    }

}

/**
 * Comics from X-Men Volume 1 are sometimes just listed (erroneously) as X-Men. This can lead to complications
 * where the correct issue is not retrieved. To remedy this when a comic is found with the fitting pattern
 * the words 'Vol 1' will be inserted to lead to the correct path.
 * @param {obj} debutObj 
 */
function XMenStandardizer(debutObj){
    var pattern = /^(X-Men) (#?\d+)/i;
    if(debutObj.success){
        for(var i = 0; i < debutObj.debutList.length; i++){
            var res = pattern.exec(debutObj.debutList[i].issue);
            if(res !== null){
                debutObj.debutList[i].issue = `${res[1]} Vol 1 ${res[2]}`;
            }
        }
    }
    return debutObj;
}

function clearResultsAndStatus(){
    $('#searchPath .col').empty();
    // empty errors and hide element
    $('#errors').empty();
    $('#errors').addClass('hide');
    // empty character/general info
    $('#info .text').empty();
    $('#info .image').empty();
    // empty debut info
    $('#debut').empty();
    
}

function displayError(message){
    var $errors = $('#errors');
    if( $errors.hasClass('hide') ){
        $errors.removeClass('hide');
        $errors.append( $('<li>').addClass('collection-item red-text error').text('ERROR') );
    }

    var $error = $('<li>').addClass('collection-item red-text error').text(message);
    $errors.append($error);
}


function toggleSwitchForActivePublisher(){
    var checkBoxes = $('.switch-publisher input[type="checkbox"]');
    checkBoxes.prop("checked", !checkBoxes.prop("checked"));
    toggleActivePublisher();
}

function toggleActivePublisher(){
    $('.switch-publisher .logo').toggleClass('inactive-image');
    $('.switch-publisher .logo').parent().parent().parent().toggleClass('marvel dc');
}
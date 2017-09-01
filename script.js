/**
 * Adapted from work by ujjawal found at https://github.com/ujjawal/Parse-Wiki-Infobox
 */
function retrieveDebut()
{
    // var searchValue = "the thing";
    // var searchValue = "Iron Man";
    var searchValue = "Anthony Stark";
    // var searchValue = "spider-man";
    // var searchValue = "Captain Marvel";
    
    // var searchQualifier = " (comics)";
    // var searchQualifier = " (Marvel Comics)";
    // var searchQualifier = "";
    var searchQualifier = " (Earth-616)";

    var script=document.createElement('script');
    script.type='text/javascript';
    script.src = 'https://marvel.wikia.com/api.php?format=json&action=query' +
    // script.src = 'https://marvel.wikia.com/api.php?format=json&action=parse' +
    // script.src = 'http://en.wikipedia.org/w/api.php?format=json&action=query' +
                 '&prop=revisions&titles=' +
                 encodeURIComponent(searchValue + searchQualifier) +
                 '&rvprop=content&rvsection=0&callback=parseWiki';
                //  '&rvprop=content&rvsection=0';
    scriptDiv = document.getElementById('wikicontent');
    scriptDiv.innerHTML = '';
    scriptDiv.appendChild(script)
    window.parseWiki = function(result)
    {
        // console.log('result: ', result);
        
        var key = 0;
        for(i in result.query.pages)
        key = i;
        
        // console.log('sub-result: ',result.query.pages[key].revisions["0"]["*"]);
        content = result.query.pages[key].revisions[0]['*'];
        // v = content.match(/{{[^]*?({{[^{}]*?}}[^]*?)*}}/g);
        // v = content.match(/debut = ''\[\[(.*)\]\]'' #(\d*) \((\w*) (\d*)\)/g);


        var debut = content.match(/\| First\s*=\s(.*)/g)[0];
        var delimiter = '= ';
        var startIndex = debut.indexOf(delimiter);
        debut = debut.substring(startIndex + delimiter.length);

        // v = content.match(/debut = ''\[\[(.*)\]\]'' #(\d*) \((\w*) (\d*)\)/g);


        // for(i=0; i< v.length; i++) { 
        //     if(v[i].match(/infobox/i)) { 
        //         foo = v[i].match(/debut = ''\[\[(.*)\]\]'' #(\d*) \((\w*) (\d*)\)/g);
        //         break;
        //     }
        // }
        console.log(debut);
        // arr = [];
        // for(i=0;i<foo.length;i++) { 
        //     arr.push(foo[i].match(/[A-Za-z].*[^\]]/)[0]);
        //     anchor = document.createElement('p');
        //     anchor.innerHTML = arr[i];
        //     anchor.href = '#';
        //     scriptDiv.appendChild(anchor);
        // }
    }
}

function retrieveIdentity()
{
    // var searchValue = "the thing";
    var searchValue = "thing";
    // var searchValue = "Iron Man";
    // var searchValue = "spider-man";
    // var searchValue = "Captain Marvel";
    
    var script=document.createElement('script');
    script.type='text/javascript';
    script.src = 'https://marvel.wikia.com/api.php?format=json&action=query' +
                 '&prop=revisions&titles=' +
                 encodeURIComponent(searchValue) +
                 '&rvprop=content&rvsection=0&callback=parseWiki';
    scriptDiv = document.getElementById('wikicontent');
    scriptDiv.innerHTML = '';
    scriptDiv.appendChild(script)
    window.parseWiki = function(result)
    {
        // console.log('result: ', result);
        
        var key = 0;
        for(i in result.query.pages)
        key = i;
        
        content = result.query.pages[key].revisions[0]['*'];
        // console.log("content: ", content);


        var identity = content.match(/Main Character\s*=\s(.*)\|/g)[0];
        var delimiter = '= [[';
        var startIndex = identity.indexOf(delimiter);
        identity = identity.substring(startIndex + delimiter.length, identity.length - 1);

        console.log(identity);

    }
}


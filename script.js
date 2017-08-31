/**
 * Adapted from work by ujjawal found at https://github.com/ujjawal/Parse-Wiki-Infobox
 */
function foo()
{
    var searchValue = "the thing";
    var searchValue = "Iron Man";
    // var searchValue = "spider-man";
    // var searchValue = "Captain Marvel";
    
    // var searchQualifier = " (comics)";
    var searchQualifier = " (Marvel Comics)";
    var searchQualifier = "";


    var script=document.createElement('script');
    script.type='text/javascript';
    // script.src = 'https://marvel.wikia.com/api.php?format=json&action=query' +
    script.src = 'http://en.wikipedia.org/w/api.php?format=json&action=query' +
                 '&prop=revisions&titles=' +
                 encodeURIComponent(searchValue + searchQualifier) +
                 '&rvprop=content&rvsection=0&callback=parseWiki';
    scriptDiv = document.getElementById('wikicontent');
    scriptDiv.innerHTML = '';
    scriptDiv.appendChild(script)
    window.parseWiki = function(result)
    {
        console.log('result: ', result);
        var key = 0;
        for(i in result.query.pages)
        key = i;
        
        content = result.query.pages[key].revisions[0]['*'];
        v = content.match(/{{[^]*?({{[^{}]*?}}[^]*?)*}}/g);
        for(i=0; i< v.length; i++) { 
            if(v[i].match(/infobox/i)) { 
                foo = v[i].match(/debut = ''\[\[(.*)\]\]'' #(\d*) \((\w*) (\d*)\)/g);
                break;
            }
        }
        arr = [];
        for(i=0;i<foo.length;i++) { 
            arr.push(foo[i].match(/[A-Za-z].*[^\]]/)[0]);
            anchor = document.createElement('p');
            anchor.innerHTML = arr[i];
            anchor.href = '#';
            scriptDiv.appendChild(anchor);
        }
    }
}
# Comics Price Guide

## Description
This application is a intended to be a resource for comics produced by Marvel Comics. By searching a character's name a chain of calls will be made to retrieve information on that character, including real name and debut comic, from Wikia resources. The information on debut comic will in turn be used to connect to the eBay API to retrieve pricing information on recently completed auctions for that comic.

## Notes About the Project
- The wiki used to gather information, and wikis in general, utilize user input data. This data is not always formatted the same, even when templates are used. Thus trying to extract data one can run into multiple anomalies leading to dead ends in the call chain.

## Version History
### Version 0.5:
- Basic chaining of wikia calls to retrieve character information about real name and debut comic and the image of their debut comic.


## Key Technologies
- **JavaScript**
- **jQuery**
- **HTML5**
- **Wikia API**
- **Regex**

## Known Issues

- Characters searched by mantle which when queried in the Marvel wiki will lead to a character disambiguation page. From this the real name of their most famous iteration, listed under "Main Character", will be used in gathering further information. For instance searching for "Spider-Man" will lead to information on "Peter Parker (Earth-616)" not "Miles Morales" or any other characters that have used the mantle. One would need to search for the more specific lesser known character to retrieve results for them.
- Some queries for debut comics are returned without volume numbers which leads to dead ends in some instances and leads to the searching of incorrect volumes in others. 
    - A work around for the first case exists in searching again for the comic the phrase "Vol 1" inserted in the title before being searched. I am not sure how stable this work around is.
    - As an example of the second case examine a search for "Magneto" vs "Beast". While both characters debut in the 1963 comic "X-Men #1" (more appropriately "X-Men Vol 1 #1"), they do not yield the same results. The searches comes back with "X-Men Vol 1 1" (and the appropriate image) and "X-Men 1" (with an incorrect image), respectively. The incorrect image is due to queries for "X-Men 1" redirecting to "X-Men Vol 2 1". Because "X-Men Vol 2" is a valid volume in the wiki, it will not trigger the work around mentioned above, and it will yield bad results. Multiple characters in the X-Men universe fall into this trap.

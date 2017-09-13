# Comics Price Guide

## Description
This application is a intended to be a resource for comics produced by Marvel Comics. By searching a character's name a chain of calls will be made to retrieve information on that character, including real name and debut comic, from Wikia resources. The information on debut comic will in turn be used to connect to the eBay API to retrieve pricing information on recently completed auctions for that comic.


## Version History
#### Version 0.5:
- Basic chaining of wikia calls to retrieve character information about real name and debut comic and the image of their debut comic.


## Key Technologies
- **JavaScript**
- **jQuery**
- **HTML5**
- **Wikia API**
- **Regex**

## Known Issues
- Some characters with multiple debuts do not have all of these debuts appear (See Scorpion) while others do (See Falcon).
- Some return values from wikia lead to disambiguation pages that need to be traversed breaking the program (See Chameleon or Betty Brant).


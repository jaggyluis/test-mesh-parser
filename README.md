# Test Mesh Parser

live link - https://jaggyluis.github.io/test-mesh-parser/build/

Small mesh parsing application that inputs a set of edges and vertices in the form of : 

```json
{
	"vertices": [
		[0, 0],
		[2, 0],
		[2, 2],
		[0, 2]
	],
	"edges": [
		[0, 1],
		[1, 2],
		[0, 2],
		[0, 3],
		[2, 3]
	]
}
```

and converts them to a mesh that can be serialized to :

```js
{
	"faces": [
		[0, 1, 2],
		[0, 2, 3]
	],
	"faceAdjacencies": {
		"0": [1],
		"1": [0]
	},
	"faceCentroids": [
		[1, 1, 2, 2], // [centroidX, centroidY, faceBoundsDX, faceBoundsDY]
		[1, 1, 2, 2]
	],
	"vertices": [
		[0, 0],
		[2, 0],
		[2, 2],
		[0, 2]
	],
	"bounds": [
		[0, 2],
		[0, 2]
	]
}
```

### Installing 

-   clone this repo
-   run ```npm install``` to get typescript and webpack installed
-   run one of ```npm run build / npm run start / npm run test``` to get up and running

### Running Tests
```
npm run test 
```

Test Data has the same format as the input data above with the additional optional properties:

```js
{
    ... //same as output data above
    "name": "rectangle with diagonal", // the test name
    "__faces": [ // expected faces, sorted ascending and joined
        "0-1-2",
        "0-2-3",
    ],
    "__faceAdjacencies" : { // expected face adjacencies sorted ascending and joined
        "0-1-2": ["0-2-3"],
        "0-2-3": ["0-1-2"],
    },
    "__faceLevels" : {
	// TODO - will test the adjacent face levels
    },
    "__facePoints" : [ // point face inclusion test
	[0.2, 0.1, 0], // [pointX, pointY, expected faceIndex matched to "__faces" order ]
	[0.5, 0.8, 1] 
    ]
}
```

Currently, all tests reside in the ./src/data/data.ts file. adding new tests involves either appending to that object, or replacing it with a new one.

### Running Application in Dev mode
```
npm run start
```
This will run a live reload version to http://localhost:8080/build/ by default.

This will load the app with all the tests as default, but additional data can be loaded in using the "load graph" button in the top left, and results can be saved using the "save mesh" button on the top right.



### Building the Application
```
npm run build
```

## TODO

- optimize triangulation and bounding checks for polygons

- implement more testing data for edge cases

- implement testing for :
    - adjacency layers

- loading previously computed mesh data into UI

- lots of optimizations 

# Test Mesh Parser

Small Mesh parsing application that converts a set of edges and vertices in the form of : 

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

and converts it to :

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
	"vertices": [
		[0, 0],
		[2, 0],
		[2, 2],
		[0, 2]
	],
	"faceCentroids": [
		[1, 1, 2, 2],
		[1, 1, 2, 2]
	],
	"bounds": [
		[0, 2],
		[0, 2]
	]
}
```

### Installing 

-   clone this repo, and run in Node.js

### Running Tests
```
@TODO - npm run test // currently broken
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
    }
}
```

Currently, all tests reside in the ./src/data/data.ts file. adding new tests involves either appending to that object, or replacing it with a new one.

### Running Application in Dev mode
```
npm run start
```

### Building the Application
```
npm run build
```

## TODO

- optimize triangulation and bounding checks for polygons - right now it's using a pretty primitive implementation
- implement triangulation and bounding checks for non convex polygons
- implement rendering for non convex polygons - right now it is treating all polygons as convex for rendering which produces incorrect visuals

- implement testing for :
    - adjacencies
    - adjacency layers
    - point inclusion

- save data and load data buttons for renderer
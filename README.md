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

```json
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

```json
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

### Running Application in Dev mode
```
npm run start
```

### Building the Application
```
npm run build
```

## TODO

- implement testing for :
    - adjacencies
    - adjacency layers
    - point inclusion
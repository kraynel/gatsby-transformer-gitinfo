# gatsby-transformer-gitinfo

Add some git information on `File` fields from latest commit: date, author and email.

## Install

`npm install --save gatsby-transformer-gitinfo`

**Note:** You also need to have `gatsby-source-filesystem` installed and configured so it
points to your files.

## How to use

In your `gatsby-config.js`

```javascript
module.exports = {
  plugins: [
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        path: `./src/data/`,
      },
    },
    `gatsby-transformer-gitinfo`,
  ],
}
```

Where the _source folder_ `./src/data/` is a git versionned directory.

The plugin will add several fields to `File` nodes: `gitLogLatestAuthorName`, `gitLogLatestAuthorEmail` and `gitLogLatestDate`. These fields are related to the latest commit touching that file.

If the file is not versionned, these fields will be `null`.

They are exposed in your graphql schema which you can query:

```graphql
query {
  allFile {
    edges {
      node {
        fields {
          gitLogLatestAuthorName
          gitLogLatestAuthorEmail
          gitLogLatestDate
        }
        internal {
          type
          mediaType
          description
          owner
        }
      }
    }
  }
}
```

Now you have a `File` node to work with:

```json
{
  "data": {
    "allFile": {
      "edges": [
        {
          "node": {
            "fields": {
              "gitLogLatestAuthorName":"John Doe",
              "gitLogLatestAuthorEmail": "john.doe@github.com",
              "gitLogLatestDate": "2019-10-14T12:58:39.000Z"
            },
            "internal": {
              "contentDigest": "c1644b03f380bc5508456ce91faf0c08",
              "type": "File",
              "mediaType": "text/yaml",
              "description": "File \"src/data/example.yml\"",
              "owner": "gatsby-source-filesystem"
            }
          }
        }
      ]
    }
  }
}
```

## Configuration options

**`include`** [regex][optional]

This plugin will try to match the absolute path of the file with the `include` regex.
If it *does not* match, the file will be skipped.

```javascript
module.exports = {
  plugins: [
    {
      resolve: `gatsby-transformer-gitinfo`,
      options: {
        include: /\.md$/i, // Only .md files
      },
    },
  ],
}
```


**`ignore`** [regex][optional]

This plugin will try to match the absolute path of the file with the `ignore` regex.
If it *does* match, the file will be skipped.

```javascript
module.exports = {
  plugins: [
    {
      resolve: `gatsby-transformer-gitinfo`,
      options: {
        ignore: /\.jpeg$/i, // All files except .jpeg
      },
    },
  ],
}
```

**`dir`** [string][optional]

The root of the git repository. Will use current directory if not provided.

**`format`** [object][optional]

The plugin will add fields to the `File` node based on the keys of the format object.
The values represent which `git log` [format string] to place in each field.

[format string]: https://git-scm.com/docs/pretty-formats#Documentation/pretty-formats.txt-emHem

If not provided, defaults to:

```javascript
{
  gitLogLatestDate: `%ai`,
  gitLogLatestAuthorName: `%an`,
  gitLogLatestAuthorEmail: "%ae",
}
```

## Example

**Note:** the execution order is first `ìnclude`, then `ignore`.

```javascript
module.exports = {
  plugins: [
    {
      resolve: `gatsby-transformer-gitinfo`,
      options: {
        include: /\.md$/i,
        ignore: /README/i,  // Will match all .md files, except README.md
      },
    },
  ],
}
```

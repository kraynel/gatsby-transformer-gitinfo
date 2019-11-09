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

The plugin will add three fields to `File` nodes: `gitDate`, `gitAuthorName` and `gitAuthorEmail`. These fields are related to the latest commit touching that file.

If the file is not versionned, these fields will be `null`.

They are exposed in your graphql schema which you can query:

```graphql
query {
  allFile {
    edges {
      node {
        fields {
          gitDate
          gitAuthorName
          gitAuthorEmail
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
              "gitDate": "2019-10-14T12:58:39.000Z",
              "gitAuthorName": "John Doe",
              "gitAuthorEmail": "john.doe@github.com"
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

**`whitelist`** [regex][optional]

This plugin will try to match the absolute path of the file with the `whitelist` regex.
If it *does not* match, the file will be skipped.

```javascript
module.exports = {
  plugins: [
    {
      resolve: `gatsby-transformer-gitinfo`,
      options: {
        whitelist: /\.md$/i, // Only .md files
      },
    },
  ],
}
```


**`blacklist`** [regex][optional]

This plugin will try to match the absolute path of the file with the `blacklist` regex.
If it *does* match, the file will be skipped.

```javascript
module.exports = {
  plugins: [
    {
      resolve: `gatsby-transformer-gitinfo`,
      options: {
        blacklist: /\.jpeg$/i, // All files except .jpeg
      },
    },
  ],
}
```

## Example

Note: the execution order is first whitelist, then blacklist.

```javascript
module.exports = {
  plugins: [
    {
      resolve: `gatsby-transformer-gitinfo`,
      options: {
        whitelist: /\.md$/i,
        blacklist: /README/i,  // Will match all .md files, except README.md
      },
    },
  ],
}
```

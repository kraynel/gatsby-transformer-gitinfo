const fs = require(`fs`);
const os = require(`os`);
const path = require(`path`);
const git = require("simple-git/promise");
const { onCreateNode } = require(`../gatsby-node`);

const tmpDir = `./tmp-test/`;

let createNodeField;
let actions;
let node;
let createNodeSpec;
let dummyRepoPath;

beforeEach(() => {
  createNodeField = jest.fn();
  actions = { createNodeField };

  node = {
    absolutePath: `/some/path/file.mdx`,
    dir: `/some/path`,
    id: `whatever`,
    parent: null,
    children: [],
    internal: {
      type: "File"
    }
  };

  createNodeSpec = {
    node,
    actions
  };
});

describe(`Processing nodes not matching initial filtering`, () => {
  it(`should not add any field when internal type is not 'File'`, async () => {
    node.internal.type = "Other";
    await onCreateNode(createNodeSpec);
    expect(createNodeField).not.toHaveBeenCalled();
  });

  it(`should not add any field when full path is not in include`, async () => {
    await onCreateNode(createNodeSpec, {
      include: /notmatching/
    });
    expect(createNodeField).not.toHaveBeenCalled();
  });

  it(`should not add any field when full path is in ignore`, async () => {
    await onCreateNode(createNodeSpec, {
      ignore: /some\/path\/file/
    });
    expect(createNodeField).not.toHaveBeenCalled();
  });

  it(`should not add any field when full path is in include and in ignore`, async () => {
    await onCreateNode(createNodeSpec, {
      include: /mdx/,
      ignore: /some\/path\/file/
    });
    expect(createNodeField).not.toHaveBeenCalled();
  });
});

describe(`Processing File nodes matching filter regex`, () => {
  beforeEach(async () => {
    dummyRepoPath = fs.mkdtempSync(
      path.join(os.tmpdir(), "gatsby-transform-gitinfo-")
    );

    const gitRepo = git(dummyRepoPath);
    await gitRepo.init();
    await gitRepo.addConfig("user.name", "Some One");
    await gitRepo.addConfig("user.email", "some@one.com");
    await gitRepo.addRemote("origin", "https://some.git.repo");

    fs.writeFileSync(`${dummyRepoPath}/README.md`, "Hello");
    await gitRepo.add("README.md");
    await gitRepo.commit("Add README", "README.md", {
      "--date": '"Mon 20 Aug 2018 20:19:19 UTC"'
    });

    fs.writeFileSync(`${dummyRepoPath}/unversionned`, "World");
  });

  it("should add log and remote git info to commited File node", async () => {
    node.absolutePath = `${dummyRepoPath}/README.md`;
    node.dir = dummyRepoPath;
    await onCreateNode(createNodeSpec, {
      include: /md/,
      dir: dummyRepoPath
    });
    expect(createNodeField).toHaveBeenCalledTimes(1);
    expect(createNodeField).toHaveBeenCalledWith({
      node,
      name: `git`,
      value: {
        log: {
          latest: {
            authorEmail: "some@one.com",
            authorName: "Some One",
            date: "2018-08-20 20:19:19 +0000"
          }
        }
      }
    });
  });

  it("should not add log or remote git info to unversionned File node", async () => {
    node.absolutePath = `${dummyRepoPath}/unversionned`;
    node.dir = dummyRepoPath;
    await onCreateNode(createNodeSpec, {
      include: /unversionned/,
      dir: dummyRepoPath
    });
    expect(createNodeField).not.toHaveBeenCalled();
  });
});

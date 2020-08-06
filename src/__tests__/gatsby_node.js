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
let dummyRepoSubmodulePath;

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

const initGitRepo = async (path, username, useremail, remote) => {
  const gitRepo = git(path);

  await gitRepo.init();
  await gitRepo.addConfig("user.name", username);
  await gitRepo.addConfig("user.email", useremail);
  await gitRepo.addRemote("origin", remote);

  return gitRepo;
}

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

    const gitRepo = await initGitRepo(
      dummyRepoPath,
      "Some One",
      "some@one.com",
      "https://some.git.repo",
    );

    fs.writeFileSync(`${dummyRepoPath}/README.md`, "Hello");
    await gitRepo.add("README.md");
    await gitRepo.commit(
      "Add README",
      "README.md", {
        "--date": '"Mon 20 Aug 2018 20:19:19 UTC"'
      }
    );

    fs.writeFileSync(`${dummyRepoPath}/unversionned`, "World");

    dummyRepoSubmodulePath = fs.mkdtempSync(
      path.join(os.tmpdir(), "gatsby-transform-gitinfo-submodule-")
    );

    const gitRepoSubmodule = await initGitRepo(
      dummyRepoSubmodulePath,
      "Some One Else",
      "someone@else.com",
      "https://some.other.git.repo",
    );

    fs.writeFileSync(`${dummyRepoSubmodulePath}/CONTENT.md`, "Hello");
    await gitRepoSubmodule.add("CONTENT.md");
    await gitRepoSubmodule.commit(
      "Add CONTENT",
      "CONTENT.md", {
        "--date": '"Mon 20 Aug 2018 20:19:19 UTC"'
      }
    );

    await gitRepo.submoduleAdd(dummyRepoSubmodulePath, "submodule")
  });

  it("should add log and remote git info to commited File node", async () => {
    node.absolutePath = `${dummyRepoPath}/README.md`;
    node.dir = dummyRepoPath;
    await onCreateNode(createNodeSpec, {
      include: /md/,
      dir: dummyRepoPath
    });
    expect(createNodeField).toHaveBeenCalledTimes(3);
    expect(createNodeField).toHaveBeenCalledWith({
      node,
      name: `gitLogLatestAuthorName`,
      value: `Some One`
    });
    expect(createNodeField).toHaveBeenCalledWith({
      node,
      name: `gitLogLatestAuthorEmail`,
      value: `some@one.com`
    });
    expect(createNodeField).toHaveBeenCalledWith({
      node,
      name: `gitLogLatestDate`,
      value: `2018-08-20 20:19:19 +0000`
    });
  });

  it("should add log and remote git info to file in submodule", async () => {
    node.absolutePath = `${dummyRepoPath}/submodule/CONTENT.md`;
    node.dir = dummyRepoPath;
    await onCreateNode(createNodeSpec, {
      include: /md/,
      dir: dummyRepoPath
    });
    expect(createNodeField).toHaveBeenCalledTimes(3);
    expect(createNodeField).toHaveBeenCalledWith({
      node,
      name: `gitLogLatestAuthorName`,
      value: `Some One Else`
    });
    expect(createNodeField).toHaveBeenCalledWith({
      node,
      name: `gitLogLatestAuthorEmail`,
      value: `someone@else.com`
    });
    expect(createNodeField).toHaveBeenCalledWith({
      node,
      name: `gitLogLatestDate`,
      value: `2018-08-20 20:19:19 +0000`
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

const git = require(`simple-git/promise`);
const path = require('path');
const fs = require('fs')

async function getLogWithRetry(gitRepo, node, retry = 2) {
  // Need retry, see https://github.com/steveukx/git-js/issues/302
  // Check again after v2 is released?

  const filePath = fs.realpathSync.native(node.absolutePath, (error, resolvedPath) => {
    if (error) {
      console.log(error)
      return
    }
    else {
      return resolvedPath
    }
  });

  const logOptions = {
    file: filePath,
    n: 1,
    format: {
      date: `%ai`,
      authorName: `%an`,
      authorEmail: "%ae"
    }
  };
  const log = await gitRepo.log(logOptions);
  if (!log.latest && retry > 0) {
    return getLogWithRetry(gitRepo, node, retry - 1);
  }

  return log;
}

async function onCreateNode({ node, actions }, pluginOptions) {
  const { createNodeField } = actions;

  if (node.internal.type !== `File`) {
    return;
  }

  if (pluginOptions.include && !pluginOptions.include.test(node.absolutePath)) {
    return;
  }

  if (pluginOptions.ignore && pluginOptions.ignore.test(node.absolutePath)) {
    return;
  }

  const gitRepo = git(pluginOptions.dir || fs.realpathSync.native(path.dirname(node.absolutePath), (error, resolvedPath) => {
    if (error) {
      console.log(error)
      return
    }
    else {
      return resolvedPath
    }
  }));
  const log = await getLogWithRetry(gitRepo, node);

  if (!log.latest) {
    return;
  }

  createNodeField({
    node,
    name: `gitLogLatestAuthorName`,
    value: log.latest.authorName
  });
  createNodeField({
    node,
    name: `gitLogLatestAuthorEmail`,
    value: log.latest.authorEmail
  });
  createNodeField({
    node,
    name: `gitLogLatestDate`,
    value: log.latest.date
  });
}

exports.onCreateNode = onCreateNode;

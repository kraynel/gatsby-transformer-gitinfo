const git = require(`simple-git/promise`);

async function getLogWithRetry(gitRepo, node, format, retry = 2) {
  // Need retry, see https://github.com/steveukx/git-js/issues/302
  // Check again after v2 is released?

  const logOptions = {
    file: node.absolutePath,
    n: 1,
    format,
  };
  const log = await gitRepo.log(logOptions);
  if (!log.latest && retry > 0) {
    return getLogWithRetry(gitRepo, node, format, retry - 1);
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

  const format = pluginOptions.format ?? {
    gitLogLatestDate: `%ai`,
    gitLogLatestAuthorName: `%an`,
    gitLogLatestAuthorEmail: "%ae",
  };

  const gitRepo = git(pluginOptions.dir);
  const log = await getLogWithRetry(gitRepo, node, format);

  if (!log.latest) {
    return;
  }

  for (const name in format) {
    createNodeField({
      node,
      name,
      value: log.latest[name],
    });
  }
}

exports.onCreateNode = onCreateNode;

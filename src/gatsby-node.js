const git = require(`simple-git/promise`);

async function onCreateNode({ node, actions }, pluginOptions) {
  const { createNodeField } = actions;

  if (node.internal.type !== `File`) {
    return;
  }

  if (
    pluginOptions.whitelist &&
    !pluginOptions.whitelist.test(node.absolutePath)
  ) {
    return;
  }

  if (
    pluginOptions.blacklist &&
    pluginOptions.blacklist.test(node.absolutePath)
  ) {
    return;
  }

  const [remotes, log] = await Promise.all([
    git(pluginOptions.repoPath).getRemotes(true),
    git(pluginOptions.repoPath).log({
      file: node.absolutePath,
      n: 1,
      format: {
        date: `%ai`,
        authorName: `%an`,
        authorEmail: "%ae"
      }
    })
  ]);

  if (!log.latest) {
    return;
  }

  const normalizedRemote = remotes.reduce((acc, remote) => {
    acc[remote.name] = remote.refs;
    return acc;
  }, {});

  createNodeField({
    node,
    name: `git`,
    value: {
      log: { latest: log.latest },
      remotes: normalizedRemote
    }
  });
}

exports.onCreateNode = onCreateNode;

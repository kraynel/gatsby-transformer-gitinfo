const git = require(`simple-git/promise`);

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

  const gitRepo = git(pluginOptions.dir);
  const [remotes, log] = await Promise.all([
    gitRepo.getRemotes(true),
    gitRepo.log({
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

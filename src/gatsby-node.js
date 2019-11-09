const git = require(`simple-git/promise`);
const _ = require(`lodash`);

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

  const fileinfo = await git().log({
    file: node.absolutePath,
    "max-count": 1,
    format: {
      date: `%ai`,
      authorName: `%an`,
      authorEmail: "%ae"
    }
  });

  if (!fileinfo.latest) {
    return;
  }

  createNodeField({
    node,
    name: `gitDate`,
    value: new Date(fileinfo.latest.date)
  });

  createNodeField({
    node,
    name: `gitAuthorName`,
    value: fileinfo.latest.authorName
  });
  createNodeField({
    node,
    name: `gitAuthorEmail`,
    value: fileinfo.latest.authorEmail
  });
}

exports.onCreateNode = onCreateNode;

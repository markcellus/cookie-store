module.exports = {
  git: {
    commitMessage: '${version}',
    requireCleanWorkingDir: false,
    requireUpstream: false,
    tagName: 'v${version}',
  },
  github: {
    release: true,
    releaseName: '${version}',
    releaseNotes: null,
    assets: ['index.js', 'index.d.ts'],
  },
  hooks: {
    'after:bump': 'npm run banner',
    'before:init': ['npm test && npm run build'],
  },
};

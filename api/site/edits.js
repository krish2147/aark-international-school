// /api/site/edits: published click-to-edit changes for every page (see api/_lib/siteEditsHandler.js).
const { createSiteEditsHandler } = require('../_lib/siteEditsHandler');
const { createContentStore } = require('../_lib/contentStore');
const { DEFAULT_SITE } = require('../_lib/siteEdits');

module.exports = createSiteEditsHandler({ store: createContentStore({ prefix: 'site', defaults: DEFAULT_SITE }) });

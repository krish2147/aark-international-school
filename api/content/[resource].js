// /api/content/staff | gallery | events | schemes | fees — one function for all five.
const { createContentHandler } = require('../_lib/contentResource');
const { createContentStore } = require('../_lib/contentStore');

module.exports = createContentHandler({ store: createContentStore() });

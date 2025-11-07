/**
 * ANSI Serializer for Jest Snapshots
 * Strips ANSI codes from snapshots for consistent testing
 */

module.exports = {
  test(val) {
    return typeof val === 'string' && /\u001b\[/.test(val);
  },
  serialize(val) {
    // Strip ANSI codes for snapshot consistency
    return val.replace(/\u001b\[[0-9;]*m/g, '');
  },
};

const { Namer } = require('@parcel/plugin');
const path = require('path');

module.exports = new Namer({
  name({ bundle }) {
    if (bundle.type === 'png' || bundle.type === 'jpg') {
      const { filePath } = bundle.getMainEntry();
      return `${path.basename(filePath)}`;
    }

    // Allow the next namer to handle this bundle.
    return null;
  },
});

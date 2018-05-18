const parse = require('csv-parse/lib/index');

module.exports = function parseCsvPromised(input, opts) {
    return new Promise((resolve, reject) => {
        parse(input, opts, (err, output) => {
            if (err) reject(err);
            resolve(output);
        });
    });
};

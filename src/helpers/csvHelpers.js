import parse from 'csv-parse/lib/index';

export default function parseCsvPromised(input, opts) {
    return new Promise((resolve, reject) => {
        parse(input, opts, (err, output) => {
            if (err) reject(err);
            resolve(output);
        });
    });
};

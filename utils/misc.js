const { LOGPATH } = process.env;
const logStream = LOGPATH ? fs.createWriteStream(path.resolve(__dirname, LOGPATH, 'scripture.log'), { flags: 'a' }) : process.stdout;

const padLeft = (str, totalLength, padCharacter) => {
    const arr = `${str}`.split('');
    const remaining = new Array(Math.max(totalLength - arr.length, 0)).fill(`${padCharacter}`);

    return [...remaining, ...arr].join('');
};

const constructTimestamp = () => {
    const date = new Date();
    const dow = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()] 
    const MM = padLeft(date.getMonth() + 1, 2, '0');
    const DD = padLeft(date.getDate(), 2, '0');
    const YYYY = date.getFullYear();
    const hh = padLeft(date.getHours(), 2, '0');
    const mm = padLeft(date.getMinutes(), 2, '0');
    const ss = padLeft(date.getSeconds(), 2, '0');
    const sss = padLeft(date.getMilliseconds(), 3, '0');
    const timestamp = `${dow} ${MM}/${DD}/${YYYY} ${hh}:${mm}:${ss}.${sss}`;

    return timestamp;
};

const logger = (message) => {
    logStream.write(`${constructTimestamp()} ${message}\n`);
};

module.exports = {
    logger
};
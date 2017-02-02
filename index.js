const Promise = require('bluebird');
const fs = require('fs-extra');
const readFile = Promise.promisify(fs.readFile);
const outputFile = Promise.promisify(fs.outputFile);
require('isomorphic-fetch');
const sanitizeForFileName = require('sanitize-filename');
const cheerio = require('cheerio');
const emojione = require('emojione');

const emojiMap = require('./emojis.json');

function unicodeToName(emojiUnicode) {
	const emojiShortName = emojione.toShort(emojiUnicode);
	const emojiName = emojiShortName.slice(1, emojiShortName.length - 1);
	return emojiName;
}


const emojipediaUnicodeVersionUrlMap = {
	'1.1': 'http://emojipedia.org/unicode-1.1/',
	'3.0': 'http://emojipedia.org/unicode-3.0/',
	'3.2': 'http://emojipedia.org/unicode-3.2/',
	'4.0': 'http://emojipedia.org/unicode-4.0/',
	'4.1': 'http://emojipedia.org/unicode-4.1/',
	'5.1': 'http://emojipedia.org/unicode-5.1/',
	'5.2': 'http://emojipedia.org/unicode-5.2/',
	'6.0': 'http://emojipedia.org/unicode-6.0/',
	'6.1': 'http://emojipedia.org/unicode-6.1/',
	'7.0': 'http://emojipedia.org/unicode-7.0/',
	'8.0': 'http://emojipedia.org/unicode-8.0/',
	'9.0': 'http://emojipedia.org/unicode-9.0/',
	'10.0': 'http://emojipedia.org/unicode-10.0/',
	'11.0': 'http://emojipedia.org/unicode-11.0/'
};


const addingEmojipediaUnicodeVersionPromises = Object.keys(emojipediaUnicodeVersionUrlMap).map((unicodeVersionKey) => {
	console.log(`Working on ${unicodeVersionKey}...`)
	const emojipediaUrl = emojipediaUnicodeVersionUrlMap[unicodeVersionKey];
	const cacheFileName = sanitizeForFileName(emojipediaUrl);
	const cacheFilePath = `./cached-pages/${cacheFileName}.html`;
	// Try to read from the cache
	return readFile(cacheFilePath, 'utf8')
		// Fallback to fetching the page again
		.catch(() => {
			return fetch(emojipediaUrl)
				.then((res) => res.text())
				.then((html) => {
					// Save the file as a cache
					outputFile(cacheFilePath, html);
					return html;
				});
		})
		.then((html) => {
			scrapeEmojipediaHtml(emojiMap, html, unicodeVersionKey);
		})
});

// Save the transformed emoji map
Promise.all(addingEmojipediaUnicodeVersionPromises)
	.then(() => {
		console.log('Filling out ZWJ sequences...');
		fillZwjSequenceUnicodeVersions(emojiMap);
	})
	.then(() => {
		// Verify each emoji has a `unicode_version`
		let missingVersionCount = 0;
		Object.keys(emojiMap).forEach((emojiNameKey) => {
			const emoji = emojiMap[emojiNameKey];
			if(emoji.unicode_version === undefined) {
				console.log(`Missing unicode_version property on \`${emojiNameKey}\``);
				missingVersionCount += 1;
			}
		});
		if(missingVersionCount > 0) {
			console.log(`Missing unicode_version property on ${missingVersionCount} emojis`);
		}
	})
	.then(() => {
		return outputFile('./dist/emojis.json', JSON.stringify(emojiMap, null, 2));
	});



function scrapeEmojipediaHtml(emojiMap, html, unicodeVersion) {
	const $ = cheerio.load(html);
	$('.container .content li')
		.each((index, el) => {
			const $el = $(el);
			const emojiUnicodeEl = $el.find('.emoji');
			if(emojiUnicodeEl.length) {
				// Get rid of the emoji presentation selectors U+FE0F at the end
				const emojiUnicode = emojiUnicodeEl.text().replace(/(\uFE0F)+$/g, '');
				const emojiNameKey = unicodeToName(emojiUnicode);
				if(emojiMap[emojiNameKey]) {
					emojiMap[emojiNameKey].unicode_version = unicodeVersion;
				}
			}
		});
}


function fillZwjSequenceUnicodeVersions(emojiMap) {
	Object.keys(emojiMap).forEach((emojiNameKey) => {
		const emoji = emojiMap[emojiNameKey];
		const emojiHexCodePoints = emoji.unicode.split('-');

		// Flags are ZWJ sequences made up of regional indicator symbol letters
		// See http://emojipedia.org/unicode-6.0/
		if (emojiNameKey.indexOf('flag_') === 0) {
			emoji.unicode_version = 6.0;
		}
		// If general ZWJ sequence
		else if(!emoji.unicode_version && emojiHexCodePoints.length > 1) {
			// Find the emoji of the ZWJ sequence with the highest unicode version
			let unicodeVersionString;
			emojiHexCodePoints.reduce((unicodeVersion, hexCodePoint) => {
				var emojiUnicode = String.fromCodePoint(parseInt(hexCodePoint, 16));
				const emojiNameKey = unicodeToName(emojiUnicode);
				const emoji = emojiMap[emojiNameKey];
				const parsedVersion = emoji && parseFloat(emoji.unicode_version);

				if(parsedVersion > unicodeVersion) {
					unicodeVersion = parsedVersion;
					unicodeVersionString = emoji.unicode_version;
				}

				return unicodeVersion;
			}, 0);

			emoji.unicode_version = unicodeVersionString || false;
		}
	});
}

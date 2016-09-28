import fs from 'fs';
import pug from 'pug';
import path from 'path';

if (!fs.statSync('dist').isDirectory())
  fs.mkdir('dist');

const SVG_TEMPLATE =
  '<svg xmlns="http://www.w3.org/2000/svg" ' +
    'version="1.1" viewBox="0 0 240 180" fill="none">' +
  '{body}' +
  '</svg>';
const BUNDLE_TEMPLATE =
  '<svg xmlns="http://www.w3.org/2000/svg" ' +
    'version="1.1" viewBox="0 0 {w} {h}" fill="none">' +
  '{body}' +
  '</svg>';
const BUNDLE_SPRITE_TEMPLATE =
  '<g transform="translate({x},{y})">{body}</g>';

const finish = (files, len, bundle, totalPugSize, totalSvgSize) => {
  bundle = BUNDLE_TEMPLATE
    .replace('{w}', 10 * 240)
    .replace('{h}', (1 + Math.floor(len / 10)) * 180)
    .replace('{body}', bundle.join(''));
  const bundleSize = bundle.length;

  fs.writeFile(path.resolve('dist', 'bundle.svg'), bundle);

  fs.readFile('src/index.pug', (err, pugText) => {
    const createBody = pug.compile(pugText, { pretty: '  ' });
    const images = files.map(f => f.replace('.pug', '.svg'));

    fs.writeFile(
      path.join('dist', 'index.html'),
      createBody({ images, totalPugSize, totalSvgSize, bundleSize })
    );
  });
}

fs.readdir('src/flags', (err, files) => {
  let totalPugSize = 0;
  let totalSvgSize = 0;
  let bundle = [];
  let i = 0;

  files.forEach(file => {
    const filePath = path.join('src/flags', file);
    fs.stat(filePath, (err, stats) => {
      if (!err) {
        totalPugSize += stats.size;
      }
    });
    fs.readFile(filePath, (err, pugSrc) => {
      const createBody = pug.compile(pugSrc);
      const body = createBody()
        .replace(/<([^\s]+)([^>]*)><\/(\1)>/g, '<$1$2 />').trim();
      const svg = SVG_TEMPLATE.replace('{body}', body);
      totalSvgSize += svg.length;

      bundle[i] = BUNDLE_SPRITE_TEMPLATE
        .replace('{x}', (i % 10) * 240)
        .replace('{y}', Math.floor(i / 10) * 180)
        .replace('{body}', body);

      fs.writeFile(path.resolve('dist', path.basename(file, '.pug') + '.svg'), svg);
      i++;
      if (i === files.length) {
        finish(files, i, bundle, totalPugSize, totalSvgSize);
      }
    });
  });
});


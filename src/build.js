import fs from 'fs';
import pug from 'pug';
import path from 'path';

if (!fs.statSync('dist').isDirectory())
  fs.mkdir('dist');

const SVG_TEMPLATE =
  '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 120 90" width="100%" height="100%" fill="none">' +
  '{body}' +
  '<rect stroke="black" width="120" height="90" />' +
  '</svg>';

fs.readdir('src/flags', (err, files) => {
  files.forEach(file => {
    fs.readFile(path.join('src/flags', file), (err, pugSrc) => {
      const createBody = pug.compile(pugSrc);
      const body = createBody()
        .replace(/<([^\s]+)([^>]*)><\/(\1)>/g, '<$1$2 />').trim();
      const svg = SVG_TEMPLATE.replace('{body}', body);

      fs.writeFile(path.resolve('dist', path.basename(file, '.pug') + '.svg'), svg);
    });
  });

  fs.readFile('src/index.pug', (err, pugText) => {
    const createBody = pug.compile(pugText, { pretty: '  ' });
    const images = files.map(f => f.replace('.pug', '.svg'));
    
    fs.writeFile(path.join('dist', 'index.html'), createBody({ images }));
  });
});


#!/bin/sh

mv ./package.json ./fake.package.json

mkdir dist

# This is a contrivance, using the transformer, as there is no alternative other than process.env
# being manipulated another way
browserify --outfile logger.js -t [ envify --NODE_ENV production  ] --standalone logger --entry ./lib/index.js

# Minify the code
google-closure-compiler --js logger.js --js_output_file logger.min.js --strict_mode_input=false

# Minify the logger code
cp ./lib/index.d.ts ./dist/index.d.ts
google-closure-compiler --js ./lib/index.js --js_output_file ./dist/index.js --strict_mode_input=false

mv ./fake.package.json ./package.json

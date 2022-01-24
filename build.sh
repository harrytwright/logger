#!/bin/sh

mv ./package.json ./fake.package.json

browserify --outfile logger.js --standalone logger --entry ./lib/index.js

# Minify the code
google-closure-compiler --js logger.js --js_output_file logger.min.js --strict_mode_input=false

mv ./fake.package.json ./package.json

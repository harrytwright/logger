#!/bin/sh


GREEN=$(tput setaf 2)
RESET=$(tput sgr0)

mv ./package.json ./fake.package.json

mkdir dist

# This is a contrivance, using the transformer, as there is no alternative other than process.env
# being manipulated another way
# -t [ envify --NODE_ENV null  ]
echo "$ ${GREEN}browserify${RESET} --outfile logger.js --standalone logger --entry ./lib/index.js"
browserify --outfile logger.js --standalone logger --entry ./lib/index.js || exit 1

# Minify the code
echo "$ ${GREEN}google-closure-compiler${RESET} --js logger.js --js_output_file logger.min.js --strict_mode_input=false"
google-closure-compiler --js logger.js --js_output_file logger.min.js --strict_mode_input=false

# Minify the logger code
echo "$ ${GREEN}google-closure-compiler${RESET} --js ./lib/index.js --js_output_file ./dist/index.js --strict_mode_input=false"
cp ./lib/index.d.ts ./dist/index.d.ts
google-closure-compiler --js ./lib/index.js --js_output_file ./dist/index.js --strict_mode_input=false

mv ./fake.package.json ./package.json

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
echo "$ ${GREEN}browserify${RESET} --outfile browser.js --standalone logger --entry ./lib/browser.js"
browserify --outfile browser.js --standalone logger --entry ./lib/browser.js || exit 1

# Minify the code
echo "$ ${GREEN}google-closure-compiler${RESET} --js logger.js --js_output_file logger.min.js --strict_mode_input=false"
google-closure-compiler --js logger.js --js_output_file logger.min.js --strict_mode_input=false
echo "$ ${GREEN}google-closure-compiler${RESET} --js browser.js --js_output_file browser.min.js --strict_mode_input=false"
google-closure-compiler --js browser.js --js_output_file browser.min.js --strict_mode_input=false

# Minify the logger code
echo "$ ${GREEN}google-closure-compiler${RESET} --js ./lib/index.js --js_output_file ./dist/index.js --language_out=ECMASCRIPT_2015 --strict_mode_input=false"
google-closure-compiler --js ./lib/index.js --js_output_file ./dist/index.js --language_out=ECMASCRIPT_2015 --strict_mode_input=false
echo "$ ${GREEN}google-closure-compiler${RESET} --js ./lib/log.js --js_output_file ./dist/log.js --language_out=ECMASCRIPT_2015 --strict_mode_input=false"
google-closure-compiler --js ./lib/log.js --js_output_file ./dist/log.js --language_out=ECMASCRIPT_2015 --strict_mode_input=false
echo "$ ${GREEN}google-closure-compiler${RESET} --js ./lib/next.js --js_output_file ./dist/next.js --language_out=ECMASCRIPT_2015 --strict_mode_input=false"
google-closure-compiler --js ./lib/next.js --js_output_file ./dist/next.js --language_out=ECMASCRIPT_2015 --strict_mode_input=false


echo "$ ${GREEN}cp${RESET} ./lib/index.d.ts ./dist/index.d.ts"
cp ./lib/index.d.ts ./dist/index.d.ts
cp ./lib/index.d.ts ./dist/next.d.ts
echo "$ ${GREEN}cp${RESET} ./browser.min.js ./dist/browser.js"
cp ./browser.min.js ./dist/browser.js

echo "$ ${GREEN}mv${RESET} ./fake.package.json ./package.json"
mv ./fake.package.json ./package.json
echo "$ ${GREEN}rm${RESET} ./browser*.js ./next*.js ./log.js"
rm ./browser*.js

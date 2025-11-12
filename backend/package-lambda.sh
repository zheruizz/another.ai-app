#!/bin/bash

# Clean previous package
rm -rf lambda-package
mkdir -p lambda-package

# Copy built dist folder
cp -r dist lambda-package/

# Copy package.json and install production dependencies
cp package.json lambda-package/
cd lambda-package
npm install --omit=dev --no-bin-links
cd ..

echo "Lambda package created in lambda-package/"

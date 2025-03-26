#!/bin/bash

# Configuration
DIST_DIR="./dist"
OUTPUT_DIR="./build"
KEY_FILE="./key.pem"
MANIFEST_FILE="$DIST_DIR/manifest.json"

# Extract name and version from manifest
EXTENSION_NAME=$(jq -r '.name' "$MANIFEST_FILE")
VERSION=$(jq -r '.version' "$MANIFEST_FILE")

# Check if manifest exists and fields were extracted
if [ ! -f "$MANIFEST_FILE" ] || [ -z "$EXTENSION_NAME" ] || [ -z "$VERSION" ]; then
    echo "Error: Could not extract required fields from $MANIFEST_FILE"
    echo "Make sure the file exists and contains valid 'name' and 'version' fields"
    exit 1
fi

# Sanitize extension name for filename (remove spaces and special characters)
EXTENSION_NAME=$(echo "$EXTENSION_NAME" | tr -dc '[:alnum:]-_' | tr '[:upper:]' '[:lower:]')

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Create zip file
echo "Creating ZIP file..."
zip -r "$OUTPUT_DIR/$EXTENSION_NAME-$VERSION.zip" "$DIST_DIR"/*
if [ $? -eq 0 ]; then
    echo "ZIP file created successfully: $OUTPUT_DIR/$EXTENSION_NAME-$VERSION.zip"
else
    echo "Error creating ZIP file"
    exit 1
fi

# Check if key file exists, generate one if it doesn't
if [ ! -f "$KEY_FILE" ]; then
    echo "Private key file ($KEY_FILE) not found"
    echo "Generating new private key..."
    if command -v openssl >/dev/null 2>&1; then
        openssl genrsa -out "$KEY_FILE" 2048
        if [ $? -eq 0 ]; then
            echo "New key generated successfully: $KEY_FILE"
        else
            echo "Error generating private key with openssl"
            exit 1
        fi
    else
        echo "Error: openssl not found. Please install openssl to generate a key"
        exit 1
    fi
else
    echo "Using existing key file: $KEY_FILE"
fi

# Create signed CRX file using available browser
echo "Creating signed CRX file..."
if command -v google-chrome >/dev/null 2>&1; then
    google-chrome --pack-extension="$DIST_DIR" --pack-extension-key="$KEY_FILE"
elif command -v chromium >/dev/null 2>&1; then
    chromium --pack-extension="$DIST_DIR" --pack-extension-key="$KEY_FILE"
elif command -v brave-browser >/dev/null 2>&1; then
    brave-browser --pack-extension="$DIST_DIR" --pack-extension-key="$KEY_FILE"
else
    echo "Error: Neither Chrome, Chromium, nor Brave found on system"
    exit 1
fi

# Move the generated .crx file to output directory
if [ -f "$DIST_DIR.crx" ]; then
    mv "$DIST_DIR.crx" "$OUTPUT_DIR/$EXTENSION_NAME-$VERSION.crx"
    echo "CRX file created successfully: $OUTPUT_DIR/$EXTENSION_NAME-$VERSION.crx"
else
    echo "Error creating CRX file"
    exit 1
fi

echo "Packaging complete!"
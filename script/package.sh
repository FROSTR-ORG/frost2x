#!/bin/bash

# Configuration
DIST_DIR="./dist"
OUTPUT_DIR="./build"
KEY_FILE="./key.pem"
MANIFEST_FILE="$DIST_DIR/manifest.json"

# Parse arguments - default to chrome if not specified
BROWSER="${1:-chrome}"

# Validate browser argument
if [ "$BROWSER" != "chrome" ] && [ "$BROWSER" != "firefox" ]; then
    echo "Usage: $0 [chrome|firefox]"
    echo "  chrome  - Build .zip and .crx for Chrome/Chromium (default)"
    echo "  firefox - Build .xpi for Firefox"
    exit 1
fi

# Extract name and version from manifest
EXTENSION_NAME=$(jq -r '.name' "$MANIFEST_FILE")
VERSION=$(jq -r '.version' "$MANIFEST_FILE")

# Check if manifest exists and fields were extracted
if [ ! -f "$MANIFEST_FILE" ] || [ -z "$EXTENSION_NAME" ] || [ -z "$VERSION" ]; then
    echo "Error: Could not extract required fields from $MANIFEST_FILE"
    echo "Make sure the file exists and contains valid 'name' and 'version' fields"
    echo "Run 'npm run build' or 'npm run build:firefox' first"
    exit 1
fi

# Sanitize extension name for filename (remove spaces and special characters)
EXTENSION_NAME=$(echo "$EXTENSION_NAME" | tr -dc '[:alnum:]-_' | tr '[:upper:]' '[:lower:]')

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

echo "Packaging $EXTENSION_NAME v$VERSION for $BROWSER..."

if [ "$BROWSER" = "firefox" ]; then
    # Firefox packaging
    OUTPUT_FILE="$OUTPUT_DIR/$EXTENSION_NAME-$VERSION-firefox.xpi"

    echo "Creating Firefox XPI file..."

    # Create xpi (zip with .xpi extension); run in subshell to avoid cwd leaks
    if ( cd "$DIST_DIR" && zip -r "../$OUTPUT_FILE" ./* ); then
        echo "XPI file created successfully: $OUTPUT_FILE"
    else
        echo "Error creating XPI file"
        exit 1
    fi

    # Run web-ext lint if available
    if command -v npx >/dev/null 2>&1; then
        echo ""
        echo "Running web-ext lint..."
        npx web-ext lint -s "$DIST_DIR" --warnings-as-errors=false || true
    fi

    echo ""
    echo "Firefox packaging complete!"
    echo ""
    echo "To test in Firefox:"
    echo "  1. Open Firefox and go to about:debugging"
    echo "  2. Click 'This Firefox' in the sidebar"
    echo "  3. Click 'Load Temporary Add-on'"
    echo "  4. Select $OUTPUT_FILE or dist/manifest.json"
    echo ""
    echo "Or use: npm run firefox:run"

else
    # Chrome packaging (original behavior)

    # Create zip file
    echo "Creating ZIP file..."
    OUTPUT_FILE="$OUTPUT_DIR/$EXTENSION_NAME-$VERSION.zip"
    if ( cd "$DIST_DIR" && zip -r "../$OUTPUT_FILE" ./* ); then
        echo "ZIP file created successfully: $OUTPUT_FILE"
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
        echo "Warning: Neither Chrome, Chromium, nor Brave found on system"
        echo "Skipping CRX creation. ZIP file is still available."
        echo "Chrome packaging complete (ZIP only)!"
        exit 0
    fi

    # Move the generated .crx file to output directory
    if [ -f "$DIST_DIR.crx" ]; then
        mv "$DIST_DIR.crx" "$OUTPUT_DIR/$EXTENSION_NAME-$VERSION.crx"
        echo "CRX file created successfully: $OUTPUT_DIR/$EXTENSION_NAME-$VERSION.crx"
    else
        echo "Error creating CRX file"
        exit 1
    fi

    echo "Chrome packaging complete!"
fi

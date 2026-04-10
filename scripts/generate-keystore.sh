#!/bin/bash
# Generate Android signing keystore for Google Play
# Run this ONCE locally, then upload secrets to GitHub

set -e

KEYSTORE="release.jks"
ALIAS="divecody"
VALIDITY_DAYS=10000   # ~27 years

echo "=== Android Keystore Generator ==="
echo ""
echo "This generates a signing key for Google Play."
echo "Keep the keystore and passwords SAFE — you can never change them after publishing."
echo ""

read -p "Keystore password: " -s KS_PASS; echo
read -p "Key password (can be same): " -s KEY_PASS; echo
read -p "Your name (CN): " CN
read -p "Organization (O): " ORG
read -p "Country code (C, e.g. CN): " COUNTRY

keytool -genkeypair \
  -keystore "$KEYSTORE" \
  -alias "$ALIAS" \
  -keyalg RSA \
  -keysize 4096 \
  -validity $VALIDITY_DAYS \
  -storepass "$KS_PASS" \
  -keypass "$KEY_PASS" \
  -dname "CN=$CN, O=$ORG, C=$COUNTRY"

echo ""
echo "=== Keystore created: $KEYSTORE ==="
echo ""
echo "SHA256 fingerprint (for assetlinks.json):"
keytool -list -v -keystore "$KEYSTORE" -alias "$ALIAS" -storepass "$KS_PASS" \
  | grep "SHA256:" | awk '{print $2}'

echo ""
echo "=== Add these GitHub Secrets ==="
echo "Go to: Settings → Secrets → Actions → New repository secret"
echo ""
echo "ANDROID_KEYSTORE_BASE64:"
base64 -i "$KEYSTORE" | tr -d '\n'
echo ""
echo ""
echo "ANDROID_KEYSTORE_PASSWORD: $KS_PASS"
echo "ANDROID_KEY_ALIAS: $ALIAS"
echo "ANDROID_KEY_PASSWORD: $KEY_PASS"
echo ""
echo "=== Update assetlinks.json ==="
echo "Replace REPLACE_WITH_YOUR_SHA256_FINGERPRINT in public/.well-known/assetlinks.json"
echo "with the SHA256 value shown above."

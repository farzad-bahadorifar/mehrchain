#!/usr/bin/env bash
set -euo pipefail

candidate=${1:?Provide the signed candidate APK}
app_id=$(node -p "require('./app-version.json').applicationId")
legacy_id=com.mehrchain.app
legacy_apk=$(mktemp --suffix=.apk)
trap 'rm -f "$legacy_apk"' EXIT

curl --fail --silent --show-error --location --retry 2 \
  'https://github.com/farzad-bahadorifar/mehrchain/releases/download/v1.0.0-rc3/mehrchain.apk' \
  --output "$legacy_apk"
printf '%s  %s\n' '0fa47123c28a356bf4d0152b9ea6a773d892e58bdb24a6c9d744ea547862aeba' "$legacy_apk" | sha256sum --check
adb install "$legacy_apk"
adb install "$candidate"
adb shell pm path "$legacy_id" | grep '^package:'
adb shell pm path "$app_id" | grep '^package:'

adb shell am start -W -n "$app_id/com.mehrchain.app.MainActivity"
for attempt in {1..12}; do
  if adb shell uiautomator dump /sdcard/mehrchain-smoke.xml >/dev/null &&
     adb shell cat /sdcard/mehrchain-smoke.xml | grep -F 'Start My Journey' >/dev/null; then
    echo 'The signed Android candidate displayed the Welcome screen.'
    break
  fi
  if (( attempt == 12 )); then
    adb logcat -d -s AndroidRuntime:E
    exit 1
  fi
  sleep 3
done

adb install -r "$candidate"
adb shell pm path "$legacy_id" | grep '^package:'
adb shell pm path "$app_id" | grep '^package:'

#!/usr/bin/env bash
set -euo pipefail

base_url="https://cdn.jsdelivr.net/npm/@audio-samples/piano-mp3-velocity4@1.0.5/audio"
target_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

download() {
  local source_name="$1"
  local target_name="$2"

  curl -fL "${base_url}/${source_name}" -o "${target_dir}/${target_name}"
}

download "A0v4.mp3" "A0v4.mp3"
download "A1v4.mp3" "A1v4.mp3"
download "A2v4.mp3" "A2v4.mp3"
download "A3v4.mp3" "A3v4.mp3"
download "A4v4.mp3" "A4v4.mp3"
download "A5v4.mp3" "A5v4.mp3"
download "A6v4.mp3" "A6v4.mp3"
download "A7v4.mp3" "A7v4.mp3"

download "C1v4.mp3" "C1v4.mp3"
download "C2v4.mp3" "C2v4.mp3"
download "C3v4.mp3" "C3v4.mp3"
download "C4v4.mp3" "C4v4.mp3"
download "C5v4.mp3" "C5v4.mp3"
download "C6v4.mp3" "C6v4.mp3"
download "C7v4.mp3" "C7v4.mp3"
download "C8v4.mp3" "C8v4.mp3"

download "D%231v4.mp3" "Dsharp1v4.mp3"
download "D%232v4.mp3" "Dsharp2v4.mp3"
download "D%233v4.mp3" "Dsharp3v4.mp3"
download "D%234v4.mp3" "Dsharp4v4.mp3"
download "D%235v4.mp3" "Dsharp5v4.mp3"
download "D%236v4.mp3" "Dsharp6v4.mp3"
download "D%237v4.mp3" "Dsharp7v4.mp3"

download "F%231v4.mp3" "Fsharp1v4.mp3"
download "F%232v4.mp3" "Fsharp2v4.mp3"
download "F%233v4.mp3" "Fsharp3v4.mp3"
download "F%234v4.mp3" "Fsharp4v4.mp3"
download "F%235v4.mp3" "Fsharp5v4.mp3"
download "F%236v4.mp3" "Fsharp6v4.mp3"
download "F%237v4.mp3" "Fsharp7v4.mp3"

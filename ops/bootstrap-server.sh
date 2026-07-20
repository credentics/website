#!/usr/bin/env bash

set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run this script as root." >&2
  exit 1
fi

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
deploy_root="/var/www/credentics"
service_name="credentics-website.service"

install_node() {
  local architecture archive node_dir temporary_dir

  case "$(uname -m)" in
    x86_64) architecture="x64" ;;
    aarch64|arm64) architecture="arm64" ;;
    *)
      echo "Unsupported server architecture: $(uname -m)" >&2
      exit 1
      ;;
  esac

  temporary_dir="$(mktemp -d)"
  trap 'rm -rf "$temporary_dir"' RETURN

  curl --fail --silent --show-error --location \
    https://nodejs.org/dist/latest-v22.x/SHASUMS256.txt \
    --output "$temporary_dir/SHASUMS256.txt"

  archive="$(awk -v architecture="$architecture" \
    '$2 ~ "node-v[0-9.]+-linux-" architecture "\\.tar\\.xz$" { print $2; exit }' \
    "$temporary_dir/SHASUMS256.txt")"

  if [[ -z "$archive" ]]; then
    echo "Could not resolve the latest Node 22 archive." >&2
    exit 1
  fi

  curl --fail --silent --show-error --location \
    "https://nodejs.org/dist/latest-v22.x/$archive" \
    --output "$temporary_dir/$archive"

  (
    cd "$temporary_dir"
    grep " $archive\$" SHASUMS256.txt | sha256sum --check --status
  )

  node_dir="${archive%.tar.xz}"
  install -d -m 755 /opt/nodejs
  tar --no-same-owner -xJf "$temporary_dir/$archive" -C /opt/nodejs
  chown -R root:root "/opt/nodejs/$node_dir"
  ln -sfn "/opt/nodejs/$node_dir" /opt/nodejs/current
  ln -sfn /opt/nodejs/current/bin/node /usr/local/bin/node
  ln -sfn /opt/nodejs/current/bin/npm /usr/local/bin/npm
  ln -sfn /opt/nodejs/current/bin/npx /usr/local/bin/npx
  ln -sfn /opt/nodejs/current/bin/corepack /usr/local/bin/corepack
}

if ! command -v node >/dev/null 2>&1 || ! node --version | grep -Eq '^v(2[2-9]|[3-9][0-9])\.'; then
  install_node
fi

install -d -o deploy -g deploy -m 755 \
  "$deploy_root/releases" \
  "$deploy_root/shared"

install -o root -g root -m 644 \
  "$script_dir/credentics-website.service" \
  "/etc/systemd/system/$service_name"

install -o root -g root -m 440 \
  "$script_dir/credentics-website-deploy.sudoers" \
  /etc/sudoers.d/credentics-website-deploy

visudo -cf /etc/sudoers.d/credentics-website-deploy
systemctl daemon-reload
systemctl enable "$service_name"

printf 'Node: %s\n' "$(node --version)"
printf 'Service enabled: %s (not started)\n' "$service_name"

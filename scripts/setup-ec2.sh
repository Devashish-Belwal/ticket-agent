#!/usr/bin/env bash
# ==============================================================================
# S30 Ticket Agent - EC2 Host Initial Setup Script (Ubuntu 22.04 / 24.04 LTS)
# ==============================================================================
# Run as root or with sudo on a clean Ubuntu EC2 instance:
#   chmod +x setup-ec2.sh
#   sudo ./setup-ec2.sh
# ==============================================================================

set -euo pipefail

echo "======================================================================"
echo ">>> [1/6] Updating packages & installing prerequisites..."
echo "======================================================================"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get upgrade -y
apt-get install -y ca-certificates curl gnupg lsb-release git ufw nginx

echo "======================================================================"
echo ">>> [2/6] Configuring 2GB Swap Memory (Prevents OOM during builds)..."
echo "======================================================================"
if [ ! -f /swapfile ]; then
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    sysctl vm.swappiness=10
    echo 'vm.swappiness=10' >> /etc/sysctl.conf
    echo "Swap allocated successfully."
else
    echo "Swapfile already exists, skipping."
fi

echo "======================================================================"
echo ">>> [3/6] Installing official Docker Engine & Docker Compose Plugin..."
echo "======================================================================"
if ! command -v docker &> /dev/null; then
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
    chmod a+r /etc/apt/keyrings/docker.asc

    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
      tee /etc/apt/sources.list.d/docker.list > /dev/null

    apt-get update -y
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    systemctl enable --now docker
else
    echo "Docker already installed, skipping."
fi

# Add ubuntu user to docker group
if id -u ubuntu &>/dev/null; then
    usermod -aG docker ubuntu
    echo "Added ubuntu user to docker group."
fi

echo "======================================================================"
echo ">>> [4/6] Configuring Nginx Reverse Proxy..."
echo "======================================================================"
# Remove default site
rm -f /etc/nginx/sites-enabled/default

# If ticket-agent repo is already cloned at /home/ubuntu/ticket-agent, link the config
APP_DIR="/home/ubuntu/ticket-agent"
if [ -f "$APP_DIR/nginx/ticket-agent.conf" ]; then
    cp "$APP_DIR/nginx/ticket-agent.conf" /etc/nginx/sites-available/ticket-agent
    ln -sf /etc/nginx/sites-available/ticket-agent /etc/nginx/sites-enabled/ticket-agent
    nginx -t && systemctl reload nginx
    echo "Nginx configuration linked and reloaded."
fi

echo "======================================================================"
echo ">>> [5/6] Configuring Firewall (UFW)..."
echo "======================================================================"
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

echo "======================================================================"
echo ">>> [6/6] Verifying installations..."
echo "======================================================================"
docker --version
docker compose version
nginx -v

echo "======================================================================"
echo ">>> Setup completed successfully!"
echo ">>> If you are logged in as 'ubuntu', log out and log back in for docker group changes to take effect."
echo "======================================================================"

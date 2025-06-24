#!/bin/bash
# GitHub Self-Hosted Runner 설치 스크립트

echo "🏃‍♂️ Installing GitHub Self-Hosted Runner..."

# Create a folder for the runner
mkdir -p ~/actions-runner && cd ~/actions-runner

# Download the latest runner package
curl -o actions-runner-linux-x64-2.311.0.tar.gz -L https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-linux-x64-2.311.0.tar.gz

# Optional: Validate the hash
echo "29fc8cf2dab4c195bb147384e7e2c94cfd4d4022c793b346a6175435265aa278  actions-runner-linux-x64-2.311.0.tar.gz" | shasum -a 256 -c

# Extract the installer
tar xzf ./actions-runner-linux-x64-2.311.0.tar.gz

echo "✅ Runner downloaded and extracted!"
echo "📝 Next steps:"
echo "1. Go to your GitHub repository"
echo "2. Navigate to Settings > Actions > Runners"
echo "3. Click 'New self-hosted runner'"
echo "4. Follow the configuration instructions"
echo "5. Run: ./config.sh --url https://github.com/YOUR_USERNAME/YOUR_REPO --token YOUR_TOKEN"
echo "6. Run: sudo ./svc.sh install && sudo ./svc.sh start"

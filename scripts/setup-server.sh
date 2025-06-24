#!/bin/bash
# 서버 초기 설정 스크립트

echo "🚀 Setting up server for Washer app deployment..."

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install nginx
sudo apt install -y nginx

# Create web directory
sudo mkdir -p /var/www/html
sudo chown -R www-data:www-data /var/www/html
sudo chmod -R 755 /var/www/html

# Create PM2 log directory
sudo mkdir -p /var/log/pm2
sudo chown -R $USER:$USER /var/log/pm2

# Setup PM2 startup
pm2 startup
# Note: Follow the instructions from the above command

# Enable nginx
sudo systemctl enable nginx
sudo systemctl start nginx

# Create nginx site configuration
sudo tee /etc/nginx/sites-available/washer-app > /dev/null << 'EOF'
server {
    listen 80;
    server_name _;
    
    location /_next/static {
        alias /var/www/html/.next/static;
        expires 365d;
        access_log off;
        add_header Cache-Control "public, immutable";
    }
    
    location /public {
        alias /var/www/html/public;
        expires 30d;
        access_log off;
    }
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/washer-app /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx

echo "✅ Server setup completed!"
echo "📝 Next steps:"
echo "1. Setup GitHub Self-Hosted Runner"
echo "2. Configure your repository secrets"
echo "3. Push your code to trigger deployment"

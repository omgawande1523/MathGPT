# Build Stage
FROM node:18-alpine AS build
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build

# Nginx Stage to serve client files
FROM nginx:1.23-alpine
COPY --from:build /app/dist /usr/share/nginx/html
# Copy default nginx configuration if customized routing is needed
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

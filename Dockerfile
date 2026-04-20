# Use the official Nginx image as a base
FROM nginx:stable-alpine

# Copy the custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the static website files to the Nginx html directory
COPY index.html /usr/share/nginx/html/
COPY script.js /usr/share/nginx/html/
COPY style.css /usr/share/nginx/html/

# Expose port 8080 (Cloud Run default)
EXPOSE 8080

# The default Nginx image starts nginx automatically, 
# but we specify it here for clarity.
CMD ["nginx", "-g", "daemon off;"]

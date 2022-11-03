# Install gcompat libs from i386 system for compiled ELF files
FROM --platform=linux/386 i386/alpine:3.16 AS compat
RUN apk add --no-cache gcompat=1.0.0-r4

# Now use x64 image and copy gcompat and dependencies from "compat"
FROM node:18-alpine3.16
COPY --from=compat [ \
  "/lib/ld-musl-i386.so.1", \
  "/lib/libc.musl-x86.so.1", \
  "/lib/ld-linux.so.2", \
  "/lib/libgcompat.so.0", \
  "/usr/lib/libobstack.so.1", \
  "/usr/lib/libobstack.so.1.0.0", \
  "/lib/libucontext.so.1", \
  "/lib/libucontext_posix.so.1", \
  "./lib/" \
]

# PM2 installation taken straight from https://github.com/keymetrics/docker-pm2
# Install PM2 (Fixed version proven to work with this node version)
RUN npm install pm2@5.2.2 -g

# Bundle ups_manager files
COPY ups ./ups/

# Bundle app files
#COPY app ./app/
#COPY package.json ./app/
COPY pm2.json .

# Install app dependencies
#ENV NPM_CONFIG_LOGLEVEL warn
#RUN npm install --production

# Show current folder structure in logs
#RUN ls -al -R

CMD [ "pm2-runtime", "start", "pm2.json" ]

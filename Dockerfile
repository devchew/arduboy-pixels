FROM node:22-alpine AS dependencies
COPY ./package.json package-lock.json /app/
WORKDIR /app
RUN npm ci

FROM node:22-alpine AS build
COPY . /app/
COPY --from=dependencies /app/node_modules /app/node_modules
WORKDIR /app
RUN npm run build


FROM nginx:alpine AS runtime
COPY ./nginx/nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 3000
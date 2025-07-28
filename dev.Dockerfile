FROM node:lts
RUN curl -o- -L https://yarnpkg.com/install.sh | bash

WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install
COPY . .
CMD ["yarn", "serve"]
# Run webpack-dev-server with mock by executing
# CMD ["yarn", "serve-mock"]
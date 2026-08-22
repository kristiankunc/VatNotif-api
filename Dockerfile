FROM node:24-alpine
WORKDIR /app
COPY package.json /app
COPY package-lock.json /app
RUN npm install
COPY . /app
RUN npx prisma generate
ENV NODE_ENV=production
EXPOSE 3001
CMD ["npm", "start"]
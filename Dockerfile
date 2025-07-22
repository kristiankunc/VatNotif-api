FROM node:22-alpine
WORKDIR /app
COPY package.json /app
COPY package-lock.json /app
RUN npm install
COPY . /app
RUN npx prisma generate
ENV NODE_ENV=production
EXPOSE 3001
CMD ["npm", "start"]
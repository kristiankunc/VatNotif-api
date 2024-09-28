FROM node
WORKDIR /app
COPY package.json /app
COPY prisma/schema.prisma /app/prisma/schema.prisma
RUN npm install
RUN npx prisma generate
RUN npx install tsx
COPY . /app
ENV NODE_ENV=production
EXPOSE 3001
CMD ["npm", "run", "start"]
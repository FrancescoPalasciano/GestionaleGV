FROM node:22-alpine

WORKDIR /workspace

# Installazione dipendenze
COPY package*.json ./
RUN npm install

# Copia del codice sorgente
COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]
